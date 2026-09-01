import crypto from "crypto";
import { pool, query, queryOne } from "@/lib/db";
import { computeProjectProgress, normalizeTaskProgressStatus } from "@/lib/data";
import {
  mapEmployee,
  mapProject,
  mapTask,
  mapMeeting,
  mapDocument,
  mapDailyReport,
  mapReportComment,
  mapNotification,
  mapActivity,
} from "./mappers";
import { hashPassword } from "./password";

// ---------------------------------------------------------------------
// Notifications + activity — shared low-level writers.
// ---------------------------------------------------------------------

export async function notify(
  userId: string,
  type: string,
  title: string,
  message: string,
  relatedType: string | null = null,
  relatedId: string | null = null,
) {
  await query(
    `INSERT INTO notifications (user_id, type, title, message, related_type, related_id)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [userId, type, title, message, relatedType, relatedId],
  );
}

export async function notifyAdmins(
  excludeUserId: string | null,
  type: string,
  title: string,
  message: string,
  relatedType: string | null = null,
  relatedId: string | null = null,
) {
  const admins = await query<{ id: string }>(
    `SELECT id FROM employees WHERE role = 'Admin' AND status = 'Active' AND id != COALESCE($1::uuid, '00000000-0000-0000-0000-000000000000'::uuid)`,
    [excludeUserId],
  );
  for (const admin of admins) {
    await notify(admin.id, type, title, message, relatedType, relatedId);
  }
}

export async function logActivity(description: string) {
  await query(`INSERT INTO activity (description) VALUES ($1)`, [description]);
}

// ---------------------------------------------------------------------
// Employees
// ---------------------------------------------------------------------

export async function findEmployeeByEmail(email: string) {
  return queryOne<any>(
    `SELECT * FROM employees WHERE lower(email) = lower($1)`,
    [email],
  );
}

export async function findEmployeeById(id: string) {
  return queryOne<any>(`SELECT * FROM employees WHERE id = $1`, [id]);
}

export async function countEmployees() {
  const row = await queryOne<{ count: string }>(
    `SELECT count(*)::text FROM employees`,
  );
  return Number(row?.count ?? 0);
}

export async function listEmployees() {
  const rows = await query<any>(
    `SELECT * FROM employees ORDER BY created_at ASC`,
  );
  return rows.map(mapEmployee);
}

export async function createEmployee(input: {
  name?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  password: string;
  role: "Admin" | "Employee";
  departments: string[];
  status: "Active" | "Inactive";
  isPrimaryAdmin?: boolean;
}) {
  const legacyName = (input.name ?? "").trim();
  const legacyParts = legacyName ? legacyName.split(/\s+/).filter(Boolean) : [];
  const firstName = (input.firstName ?? legacyParts[0] ?? "").trim();
  const lastName = (input.lastName ?? legacyParts.slice(1).join(" ")).trim();
  const name =
    [firstName, lastName].filter(Boolean).join(" ").trim() ||
    legacyName ||
    "Unknown";
  const passwordHash = await hashPassword(input.password);
  const row = await queryOne<any>(
    `INSERT INTO employees (name, first_name, last_name, email, password_hash, role, departments, status, is_primary_admin)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [
      name,
      firstName,
      lastName,
      input.email,
      passwordHash,
      input.role,
      input.departments,
      input.status,
      !!input.isPrimaryAdmin,
    ],
  );
  return mapEmployee(row);
}

export async function updateEmployee(
  id: string,
  patch: Partial<{
    name: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: "Admin" | "Employee";
    departments: string[];
    status: "Active" | "Inactive";
  }>,
) {
  const existing = await queryOne<any>(
    `SELECT * FROM employees WHERE id = $1`,
    [id],
  );
  if (!existing) return null;

  // The Primary Administrator can never be demoted or deactivated, no
  // matter who's calling this — enforced here, not just in the UI.
  const role = existing.is_primary_admin
    ? "Admin"
    : (patch.role ?? existing.role);
  const status = existing.is_primary_admin
    ? "Active"
    : (patch.status ?? existing.status);

  const existingNameParts = (existing.name ?? "").split(/\s+/).filter(Boolean);
  const nextFirstName = (
    patch.firstName ??
    existing.first_name ??
    existingNameParts[0] ??
    ""
  ).trim();
  const nextLastName = (
    patch.lastName ??
    existing.last_name ??
    existingNameParts.slice(1).join(" ")
  ).trim();
  const nextName =
    (
      patch.name ?? [nextFirstName, nextLastName].filter(Boolean).join(" ")
    ).trim() || existing.name;
  const passwordHash = patch.password
    ? await hashPassword(patch.password)
    : existing.password_hash;

  const row = await queryOne<any>(
    `UPDATE employees SET
       name = $1, first_name = $2, last_name = $3, email = $4, password_hash = $5, role = $6,
       departments = $7, status = $8
     WHERE id = $9 RETURNING *`,
    [
      nextName,
      nextFirstName,
      nextLastName,
      patch.email ?? existing.email,
      passwordHash,
      role,
      patch.departments ?? existing.departments,
      status,
      id,
    ],
  );
  return mapEmployee(row);
}

// ---------------------------------------------------------------------
// Password reset — forgot-password email flow.
// ---------------------------------------------------------------------

// Creates a reset token for an employee and returns the RAW token (to be
// emailed). Only the SHA-256 hash of it is stored, so this value is never
// recoverable from the database afterwards.
export async function createPasswordResetToken(employeeId: string) {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await query(
    `INSERT INTO password_reset_tokens (employee_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
    [employeeId, tokenHash, expiresAt],
  );
  return rawToken;
}

// Validates a raw token from a reset link, sets the new password if it's
// still good, marks the token used, and kills every existing session for
// that employee so a stolen/open session doesn't survive the reset.
export async function consumePasswordResetToken(
  rawToken: string,
  newPassword: string,
) {
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const row = await queryOne<any>(
    `SELECT * FROM password_reset_tokens
     WHERE token_hash = $1 AND used_at IS NULL AND expires_at > now()`,
    [tokenHash],
  );
  if (!row) {
    return {
      ok: false as const,
      error: "This reset link is invalid or has expired.",
    };
  }

  const passwordHash = await hashPassword(newPassword);
  await query(`UPDATE employees SET password_hash = $1 WHERE id = $2`, [
    passwordHash,
    row.employee_id,
  ]);
  await query(
    `UPDATE password_reset_tokens SET used_at = now() WHERE id = $1`,
    [row.id],
  );
  await query(`DELETE FROM sessions WHERE employee_id = $1`, [row.employee_id]);

  return { ok: true as const };
}

export type EmployeeRemovalStrategy =
  | { type: "unassign" }
  | { type: "reassign"; toEmployeeId: string };

// Soft-deletes (deactivates) an employee. Historical daily reports and
// activity are left untouched; unfinished tasks are unassigned or
// reassigned; project memberships are cleared.
export async function deactivateEmployee(
  id: string,
  strategy: EmployeeRemovalStrategy,
  actorId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const existing = await queryOne<any>(
    `SELECT * FROM employees WHERE id = $1`,
    [id],
  );
  if (!existing) return { ok: false, error: "Employee not found." };
  if (existing.is_primary_admin) {
    return { ok: false, error: "The Primary Administrator cannot be removed." };
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const activeTasks = await client.query(
      `SELECT id, name FROM tasks WHERE assignee_id = $1 AND status != 'Completed'`,
      [id],
    );

    if (strategy.type === "reassign") {
      await client.query(
        `UPDATE tasks SET assignee_id = $1 WHERE assignee_id = $2 AND status != 'Completed'`,
        [strategy.toEmployeeId, id],
      );
    } else {
      await client.query(
        `UPDATE tasks SET assignee_id = NULL WHERE assignee_id = $1 AND status != 'Completed'`,
        [id],
      );
    }

    await client.query(`DELETE FROM project_members WHERE employee_id = $1`, [
      id,
    ]);
    await client.query(`DELETE FROM sessions WHERE employee_id = $1`, [id]);
    await client.query(
      `UPDATE employees SET status = 'Inactive', deactivated_at = now() WHERE id = $1`,
      [id],
    );

    await client.query("COMMIT");

    if (strategy.type === "reassign") {
      for (const task of activeTasks.rows) {
        await notify(
          strategy.toEmployeeId,
          "task-assigned",
          "New task assigned",
          `You have been assigned "${task.name}" (reassigned from ${existing.name}).`,
          "task",
          task.id,
        );
      }
    }
    await logActivity(`${existing.name} was removed from the team.`);
    await notifyAdmins(
      actorId,
      "announcement",
      "Employee removed",
      `${existing.name} was removed from the team.`,
      "employee",
      id,
    );
    return { ok: true };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

// Full self-service account deletion (soft delete, same mechanics as
// deactivateEmployee) — used by "delete my own account".
export async function deleteOwnAccount(employeeId: string) {
  const existing = await queryOne<any>(
    `SELECT * FROM employees WHERE id = $1`,
    [employeeId],
  );
  if (!existing) return { ok: false as const, error: "Account not found." };
  if (existing.is_primary_admin) {
    return {
      ok: false as const,
      error: "The Primary Administrator cannot delete their own account.",
    };
  }
  return deactivateEmployee(employeeId, { type: "unassign" }, employeeId);
}

// ---------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------

async function getProjectMemberIds(projectId: string) {
  const rows = await query<{ employee_id: string }>(
    `SELECT employee_id FROM project_members WHERE project_id = $1`,
    [projectId],
  );
  return rows.map((r) => r.employee_id);
}

export async function listProjects() {
  const rows = await query<any>(
    `SELECT * FROM projects ORDER BY created_at ASC`,
  );
  const out = [];
  for (const row of rows) {
    out.push(mapProject(row, await getProjectMemberIds(row.id)));
  }
  return out;
}

export async function createProject(
  input: {
    name: string;
    description: string;
    status: string;
    startDate: string;
    deadline: string;
    memberIds: string[];
  },
  actorId: string,
) {
  const row = await queryOne<any>(
    `INSERT INTO projects (name, description, status, start_date, deadline)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [
      input.name,
      input.description,
      input.status,
      input.startDate || null,
      input.deadline || null,
    ],
  );
  for (const employeeId of input.memberIds) {
    await query(
      `INSERT INTO project_members (project_id, employee_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
      [row.id, employeeId],
    );
  }
  await logActivity(`Project "${row.name}" was created.`);
  for (const employeeId of input.memberIds) {
    await notify(
      employeeId,
      "project-membership",
      "Added to project",
      `You were added to the project "${row.name}".`,
      "project",
      row.id,
    );
  }
  await notifyAdmins(
    actorId,
    "announcement",
    "Project created",
    `Project "${row.name}" was created.`,
    "project",
    row.id,
  );
  return mapProject(row, input.memberIds);
}

export async function updateProject(
  id: string,
  patch: Partial<{
    description: string;
    status: string;
    startDate: string;
    deadline: string;
  }>,
) {
  const existing = await queryOne<any>(`SELECT * FROM projects WHERE id = $1`, [
    id,
  ]);
  if (!existing) return null;
  const row = await queryOne<any>(
    `UPDATE projects SET description=$1, status=$2, start_date=$3, deadline=$4 WHERE id=$5 RETURNING *`,
    [
      patch.description ?? existing.description,
      patch.status ?? existing.status,
      patch.startDate !== undefined
        ? patch.startDate || null
        : existing.start_date,
      patch.deadline !== undefined ? patch.deadline || null : existing.deadline,
      id,
    ],
  );
  if (patch.status && patch.status !== existing.status) {
    await logActivity(
      `Project "${existing.name}" status changed to ${patch.status}.`,
    );
  } else {
    await logActivity(`Project "${existing.name}" was updated.`);
  }
  return mapProject(row, await getProjectMemberIds(id));
}

export async function deleteProject(id: string, actorId: string) {
  const project = await queryOne<any>(`SELECT * FROM projects WHERE id = $1`, [
    id,
  ]);
  if (!project) return;
  const memberIds = await getProjectMemberIds(id);
  const assignees = await query<{ assignee_id: string }>(
    `SELECT DISTINCT assignee_id FROM tasks WHERE project_id = $1 AND assignee_id IS NOT NULL`,
    [id],
  );
  await query(`DELETE FROM projects WHERE id = $1`, [id]); // cascades tasks
  await logActivity(`Project "${project.name}" was deleted.`);
  const notified = new Set([
    ...memberIds,
    ...assignees.map((a) => a.assignee_id),
  ]);
  for (const employeeId of notified) {
    await notify(
      employeeId,
      "announcement",
      "Project deleted",
      `The project "${project.name}" was deleted and its tasks were removed.`,
      "project",
      null,
    );
  }
}

export async function addProjectMember(projectId: string, employeeId: string) {
  const project = await queryOne<any>(`SELECT * FROM projects WHERE id = $1`, [
    projectId,
  ]);
  const employee = await queryOne<any>(
    `SELECT * FROM employees WHERE id = $1`,
    [employeeId],
  );
  if (!project || !employee) return;
  await query(
    `INSERT INTO project_members (project_id, employee_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
    [projectId, employeeId],
  );
  await logActivity(`${employee.name} was added to project "${project.name}".`);
  await notify(
    employeeId,
    "project-membership",
    "Added to project",
    `You were added to the project "${project.name}".`,
    "project",
    projectId,
  );
}

export async function removeProjectMember(
  projectId: string,
  employeeId: string,
) {
  const project = await queryOne<any>(`SELECT * FROM projects WHERE id = $1`, [
    projectId,
  ]);
  const employee = await queryOne<any>(
    `SELECT * FROM employees WHERE id = $1`,
    [employeeId],
  );
  if (!project || !employee) return;
  await query(
    `DELETE FROM project_members WHERE project_id = $1 AND employee_id = $2`,
    [projectId, employeeId],
  );
  await logActivity(
    `${employee.name} was removed from project "${project.name}".`,
  );
  await notify(
    employeeId,
    "project-membership",
    "Removed from project",
    `You were removed from the project "${project.name}".`,
    "project",
    projectId,
  );
}

// Keeps project status in sync with its tasks: fully completed -> Completed,
// no longer fully completed -> back to In Progress. Projects with no tasks
// are left alone so a manually chosen status isn't overridden.
async function syncProjectStatus(projectId: string) {
<<<<<<< HEAD
  const project = await queryOne<any>(`SELECT * FROM projects WHERE id = $1`, [
    projectId,
  ]);
  if (!project) return;
  const tasks = await query<{ status: string }>(
    `SELECT status FROM tasks WHERE project_id = $1`,
    [projectId],
=======
  const project = await queryOne<any>(`SELECT * FROM projects WHERE id = $1`, [projectId]);
  if (!project) return;
  const tasks = await query<{ status: string; progress: number }>(
    `SELECT status, progress FROM tasks WHERE project_id = $1`,
    [projectId]
>>>>>>> 41e4dd42d738ad8294ae99c8fe8b2175a55bb829
  );
  if (tasks.length === 0) return;

  const progress = computeProjectProgress(tasks as any);
  let nextStatus = project.status;
  if (progress === 100 && project.status !== "Completed")
    nextStatus = "Completed";
  else if (progress < 100 && project.status === "Completed")
    nextStatus = "In Progress";

  if (nextStatus !== project.status) {
    await query(`UPDATE projects SET status = $1 WHERE id = $2`, [
      nextStatus,
      projectId,
    ]);
  }
}

// ---------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------

export async function listTasks() {
  const rows = await query<any>(`SELECT * FROM tasks ORDER BY created_at ASC`);
  return rows.map(mapTask);
}

export async function createTask(
  input: {
    name: string;
    description: string;
    projectId: string;
    assigneeId: string | null;
    status: string;
    priority: string;
    startDate: string;
    durationDays: number;
    deadline: string;
    progress: number;
    dependsOnTaskId: string | null;
  },
  actorId: string,
) {
  const progress = input.status === "Completed" ? 100 : input.progress;
  const row = await queryOne<any>(
    `INSERT INTO tasks (project_id, assignee_id, name, description, status, priority, start_date, duration_days, deadline, progress, depends_on_task_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
    [
      input.projectId,
      input.assigneeId,
      input.name,
      input.description,
      input.status,
      input.priority,
      input.startDate || null,
      input.durationDays,
      input.deadline || null,
      progress,
      input.dependsOnTaskId,
    ],
  );
  await logActivity(`Task "${row.name}" was created.`);
  await syncProjectStatus(input.projectId);

  if (input.assigneeId) {
    const assignee = await queryOne<any>(
      `SELECT * FROM employees WHERE id = $1`,
      [input.assigneeId],
    );
    await notify(
      input.assigneeId,
      "task-assigned",
      "New task assigned",
      `You have been assigned "${row.name}".`,
      "task",
      row.id,
    );
    await notifyAdmins(
      actorId,
      "task-assigned",
      "Task assigned",
      `"${row.name}" was assigned to ${assignee?.name ?? "an employee"}.`,
      "task",
      row.id,
    );
  }
  return mapTask(row);
}

export async function updateTask(
  id: string,
  patch: Partial<{
    name: string;
    description: string;
    assigneeId: string | null;
    status: string;
    priority: string;
    startDate: string;
    durationDays: number;
    deadline: string;
    progress: number;
    dependsOnTaskId: string | null;
  }>,
  actorId: string,
) {
  const existing = await queryOne<any>(`SELECT * FROM tasks WHERE id = $1`, [
    id,
  ]);
  if (!existing) return null;

<<<<<<< HEAD
  const nextStatus = patch.status ?? existing.status;
  const nextProgress =
    patch.progress !== undefined
      ? patch.progress
      : nextStatus === "Completed"
        ? 100
        : existing.progress;
=======
  const normalized = normalizeTaskProgressStatus(
    (patch.status ?? existing.status) as any,
    patch.progress !== undefined ? patch.progress : existing.progress
  );
>>>>>>> 41e4dd42d738ad8294ae99c8fe8b2175a55bb829

  const row = await queryOne<any>(
    `UPDATE tasks SET
       name=$1, description=$2, assignee_id=$3, status=$4, priority=$5,
       start_date=$6, duration_days=$7, deadline=$8, progress=$9, depends_on_task_id=$10
     WHERE id=$11 RETURNING *`,
    [
      patch.name ?? existing.name,
      patch.description ?? existing.description,
      patch.assigneeId !== undefined ? patch.assigneeId : existing.assignee_id,
      normalized.status,
      patch.priority ?? existing.priority,
      patch.startDate ?? existing.start_date,
      patch.durationDays ?? existing.duration_days,
<<<<<<< HEAD
      nextProgress,
      patch.dependsOnTaskId !== undefined
        ? patch.dependsOnTaskId
        : existing.depends_on_task_id,
=======
      patch.deadline ?? existing.deadline,
      normalized.progress,
      patch.dependsOnTaskId !== undefined ? patch.dependsOnTaskId : existing.depends_on_task_id,
>>>>>>> 41e4dd42d738ad8294ae99c8fe8b2175a55bb829
      id,
    ],
  );

  await syncProjectStatus(existing.project_id);

  if (
    patch.assigneeId !== undefined &&
    patch.assigneeId !== existing.assignee_id
  ) {
    if (existing.assignee_id) {
      const prevAssignee = await queryOne<any>(
        `SELECT * FROM employees WHERE id = $1`,
        [existing.assignee_id],
      );
      await notify(
        existing.assignee_id,
        "task-unassigned",
        "Task unassigned",
        `"${existing.name}" is no longer assigned to you.`,
        "task",
        id,
      );
      await logActivity(
        `Task "${existing.name}" was unassigned from ${prevAssignee?.name ?? "an employee"}.`,
      );
    }
    if (patch.assigneeId) {
      const newAssignee = await queryOne<any>(
        `SELECT * FROM employees WHERE id = $1`,
        [patch.assigneeId],
      );
      await notify(
        patch.assigneeId,
        "task-assigned",
        "New task assigned",
        `You have been assigned "${existing.name}".`,
        "task",
        id,
      );
      await notifyAdmins(
        actorId,
        "task-assigned",
        "Task assigned",
        `"${existing.name}" was assigned to ${newAssignee?.name ?? "an employee"}.`,
        "task",
        id,
      );
      await logActivity(
        `Task "${existing.name}" was assigned to ${newAssignee?.name ?? "an employee"}.`,
      );
    }
  }

  if (patch.status && patch.status !== existing.status) {
    await logActivity(
      `Task "${existing.name}" status changed to ${patch.status}.`,
    );
    if (patch.status === "Completed") {
      await notifyAdmins(
        actorId,
        "task-status",
        "Task completed",
        `"${existing.name}" was marked Completed.`,
        "task",
        id,
      );
      if (existing.assignee_id && existing.assignee_id !== actorId) {
        await notify(
          existing.assignee_id,
          "task-status",
          "Task completed",
          `"${existing.name}" was marked Completed.`,
          "task",
          id,
        );
      }
    }
  } else if (patch.assigneeId === undefined) {
    await logActivity(`Task "${existing.name}" was updated.`);
  }

  return mapTask(row);
}

export async function deleteTask(id: string, actorId: string) {
  const task = await queryOne<any>(`SELECT * FROM tasks WHERE id = $1`, [id]);
  if (!task) return;
  await query(`DELETE FROM tasks WHERE id = $1`, [id]);
  await syncProjectStatus(task.project_id);
  await logActivity(`Task "${task.name}" was deleted.`);
  if (task.assignee_id) {
    await notify(
      task.assignee_id,
      "task-unassigned",
      "Task removed",
      `"${task.name}" was deleted and is no longer assigned to you.`,
      "task",
      null,
    );
  }
}

// ---------------------------------------------------------------------
// Meetings
// ---------------------------------------------------------------------

async function getMeetingAttendeeIds(meetingId: string) {
  const rows = await query<{ employee_id: string }>(
    `SELECT employee_id FROM meeting_attendees WHERE meeting_id = $1`,
    [meetingId],
  );
  return rows.map((r) => r.employee_id);
}

export async function listMeetings() {
  const rows = await query<any>(`SELECT * FROM meetings ORDER BY date ASC`);
  const out = [];
  for (const row of rows) {
    out.push(mapMeeting(row, await getMeetingAttendeeIds(row.id)));
  }
  return out;
}

export async function createMeeting(
  input: {
    title: string;
    date: string;
    time: string;
    platform?: string;
    meetingLink?: string;
    attendeeIds: string[];
    projectId: string | null;
    details: string;
  },
  actorId: string,
) {
  const row = await queryOne<any>(
    `INSERT INTO meetings (title, date, time, platform, meeting_link, project_id, details)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [
      input.title,
      input.date,
      input.time,
      input.platform || "Google Meet",
      input.meetingLink || null,
      input.projectId,
      input.details,
    ],
  );
  for (const employeeId of input.attendeeIds) {
    await query(
      `INSERT INTO meeting_attendees (meeting_id, employee_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
      [row.id, employeeId],
    );
  }
  await logActivity(`Meeting "${row.title}" was scheduled.`);
  const platformText = input.platform ? ` via ${input.platform}` : "";
  for (const employeeId of input.attendeeIds.filter((a) => a !== actorId)) {
    await notify(
      employeeId,
      "meeting",
      "Meeting scheduled",
      `You were invited to "${row.title}" on ${input.date} at ${input.time}${platformText}.`,
      "meeting",
      row.id,
    );
  }
  return mapMeeting(row, input.attendeeIds);
}

export async function updateMeeting(
  id: string,
  patch: Partial<{
    title: string;
    date: string;
    time: string;
    platform: string;
    meetingLink?: string;
    attendeeIds: string[];
    projectId: string | null;
    details: string;
  }>,
  actorId: string,
) {
  const existing = await queryOne<any>(`SELECT * FROM meetings WHERE id = $1`, [
    id,
  ]);
  if (!existing) return null;
  const row = await queryOne<any>(
    `UPDATE meetings SET
       title=$1, date=$2, time=$3,
       platform=COALESCE($4, platform),
       meeting_link=$5,
       project_id=$6, details=$7
     WHERE id=$8 RETURNING *`,
    [
      patch.title ?? existing.title,
      patch.date ?? existing.date,
      patch.time ?? existing.time,
      patch.platform !== undefined ? patch.platform : null,
      patch.meetingLink !== undefined
        ? patch.meetingLink || null
        : existing.meeting_link,
      patch.projectId !== undefined ? patch.projectId : existing.project_id,
      patch.details ?? existing.details,
      id,
    ],
  );

  const existingAttendeeIds = await getMeetingAttendeeIds(id);
  if (patch.attendeeIds) {
    await query(`DELETE FROM meeting_attendees WHERE meeting_id = $1`, [id]);
    for (const employeeId of patch.attendeeIds) {
      await query(
        `INSERT INTO meeting_attendees (meeting_id, employee_id) VALUES ($1,$2)`,
        [id, employeeId],
      );
    }
    const added = patch.attendeeIds.filter(
      (a) => !existingAttendeeIds.includes(a) && a !== actorId,
    );
    for (const employeeId of added) {
      await notify(
        employeeId,
        "meeting",
        "Meeting scheduled",
        `You were invited to "${row.title}".`,
        "meeting",
        id,
      );
    }
  }

  await logActivity(`Meeting "${row.title}" was updated.`);
  return mapMeeting(row, patch.attendeeIds ?? existingAttendeeIds);
}

export async function deleteMeeting(id: string, actorId: string) {
  const meeting = await queryOne<any>(`SELECT * FROM meetings WHERE id = $1`, [
    id,
  ]);
  if (!meeting) return;
  const attendeeIds = await getMeetingAttendeeIds(id);
  await query(`DELETE FROM meetings WHERE id = $1`, [id]);
  await logActivity(`Meeting "${meeting.title}" was removed.`);
  for (const employeeId of attendeeIds.filter((a) => a !== actorId)) {
    await notify(
      employeeId,
      "meeting",
      "Meeting cancelled",
      `"${meeting.title}" was cancelled.`,
      "meeting",
      null,
    );
  }
}

// ---------------------------------------------------------------------
// Documents
// ---------------------------------------------------------------------

export async function listDocuments() {
  const rows = await query<any>(
    `SELECT * FROM documents ORDER BY updated_at DESC`,
  );
  return rows.map(mapDocument);
}

export async function findDocumentById(id: string) {
  const row = await queryOne<any>(`SELECT * FROM documents WHERE id = $1`, [
    id,
  ]);
  return row ? mapDocument(row) : null;
}

export async function createDocument(input: {
  name: string;
  description: string;
  projectId: string;
  fileName?: string;
  fileData?: string;
  fileSize?: number;
  mimeType?: string;
}) {
  const row = await queryOne<any>(
    `INSERT INTO documents (name, description, project_id, file_name, file_data, file_size, mime_type)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [
      input.name,
      input.description,
      input.projectId,
      input.fileName || null,
      input.fileData || null,
      input.fileSize || null,
      input.mimeType || null,
    ],
  );
  await logActivity(`Document "${row.name}" was added.`);
  return mapDocument(row);
}

export async function updateDocument(
  id: string,
  patch: Partial<{
    name: string;
    description: string;
    projectId: string;
    fileName?: string;
    fileData?: string;
    fileSize?: number;
    mimeType?: string;
  }>,
) {
  const existing = await queryOne<any>(
    `SELECT * FROM documents WHERE id = $1`,
    [id],
  );
  if (!existing) return null;
  const row = await queryOne<any>(
    `UPDATE documents SET
       name=$1, description=$2, project_id=$3,
       file_name=COALESCE($4, file_name),
       file_data=COALESCE($5, file_data),
       file_size=COALESCE($6, file_size),
       mime_type=COALESCE($7, mime_type),
       updated_at=now()
     WHERE id=$8 RETURNING *`,
    [
      patch.name ?? existing.name,
      patch.description ?? existing.description,
      patch.projectId !== undefined ? patch.projectId : existing.project_id,
      patch.fileName !== undefined ? patch.fileName : null,
      patch.fileData !== undefined ? patch.fileData : null,
      patch.fileSize !== undefined ? patch.fileSize : null,
      patch.mimeType !== undefined ? patch.mimeType : null,
      id,
    ],
  );
  await logActivity(`Document "${row.name}" was updated.`);
  return mapDocument(row);
}

export async function deleteDocument(id: string) {
  const doc = await queryOne<any>(`SELECT * FROM documents WHERE id = $1`, [
    id,
  ]);
  if (!doc) return;
  await query(`DELETE FROM documents WHERE id = $1`, [id]);
  await logActivity(`Document "${doc.name}" was removed.`);
}

// ---------------------------------------------------------------------
// Daily reports
// ---------------------------------------------------------------------

export async function listDailyReports() {
<<<<<<< HEAD
  const rows = await query<any>(
    `SELECT * FROM daily_reports ORDER BY submitted_at DESC`,
  );
  return rows.map(mapDailyReport);
=======
  const rows = await query<any>(`SELECT * FROM daily_reports ORDER BY submitted_at DESC`);
  return rows.map(mapDailyReport);
}

export async function findDailyReportById(id: string) {
  const row = await queryOne<any>(`SELECT * FROM daily_reports WHERE id = $1`, [id]);
  return row ? mapDailyReport(row) : null;
}

// Only the report's own author or an Admin may edit it — enforced here,
// not just by hiding the Edit button in the UI.
export async function updateDailyReport(
  id: string,
  patch: Partial<{ date: string; workedOn: string; completed: string; remaining: string; blockers: string }>,
  actorId: string,
  isAdmin: boolean
) {
  const existing = await findDailyReportById(id);
  if (!existing) return { ok: false as const, error: "Report not found." };
  if (existing.employeeId !== actorId && !isAdmin) {
    return { ok: false as const, error: "You can only edit your own report." };
  }

  const row = await queryOne<any>(
    `UPDATE daily_reports SET
       date = $1, worked_on = $2, completed = $3, remaining = $4, blockers = $5
     WHERE id = $6 RETURNING *`,
    [
      patch.date ?? existing.date,
      patch.workedOn ?? existing.workedOn,
      patch.completed ?? existing.completed,
      patch.remaining ?? existing.remaining,
      patch.blockers ?? existing.blockers,
      id,
    ]
  );

  const employee = await queryOne<any>(`SELECT * FROM employees WHERE id = $1`, [existing.employeeId]);
  await logActivity(`${employee?.name ?? "An employee"} updated a daily report.`);
  return { ok: true as const, report: mapDailyReport(row) };
>>>>>>> 41e4dd42d738ad8294ae99c8fe8b2175a55bb829
}

export async function createDailyReport(input: {
  employeeId: string;
  date: string;
  workedOn: string;
  completed: string;
  remaining: string;
  blockers: string;
}) {
  const row = await queryOne<any>(
    `INSERT INTO daily_reports (employee_id, date, worked_on, completed, remaining, blockers)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [
      input.employeeId,
      input.date,
      input.workedOn,
      input.completed,
      input.remaining,
      input.blockers,
    ],
  );
  const employee = await queryOne<any>(
    `SELECT * FROM employees WHERE id = $1`,
    [input.employeeId],
  );
  await logActivity(
    `${employee?.name ?? "An employee"} submitted a daily report.`,
  );
  await notify(
    input.employeeId,
    "daily-report",
    "Daily report submitted",
    "Your daily report for today was submitted successfully. Well done.",
    "report",
    row.id,
  );
  await notifyAdmins(
    input.employeeId,
    "daily-report",
    "Daily report submitted",
    `${employee?.name ?? "An employee"} submitted today's daily report.`,
    "report",
    row.id,
  );
  return mapDailyReport(row);
}

<<<<<<< HEAD
export async function findDailyReportById(id: string) {
  return queryOne<any>(`SELECT * FROM daily_reports WHERE id = $1`, [id]);
}

// Only the report's own author or an Admin may edit it — enforced here,
// not just by hiding the Edit button in the UI.
export async function updateDailyReport(
  id: string,
  patch: Partial<{
    date: string;
    workedOn: string;
    completed: string;
    remaining: string;
    blockers: string;
  }>,
  actorId: string,
  isAdmin: boolean,
) {
  const existing = await findDailyReportById(id);
  if (!existing) return { ok: false as const, error: "Report not found." };
  if (existing.employee_id !== actorId && !isAdmin) {
    return { ok: false as const, error: "You can only edit your own report." };
  }

  const row = await queryOne<any>(
    `UPDATE daily_reports SET
       date = $1, worked_on = $2, completed = $3, remaining = $4, blockers = $5
     WHERE id = $6 RETURNING *`,
    [
      patch.date ?? existing.date,
      patch.workedOn ?? existing.worked_on,
      patch.completed ?? existing.completed,
      patch.remaining ?? existing.remaining,
      patch.blockers ?? existing.blockers,
      id,
    ],
  );
  return { ok: true as const, report: mapDailyReport(row) };
}

=======
>>>>>>> 41e4dd42d738ad8294ae99c8fe8b2175a55bb829
// ---------------------------------------------------------------------
// Daily report comments — anyone can comment on anyone's report.
// ---------------------------------------------------------------------

export async function listDailyReportComments(reportId: string) {
  const rows = await query<any>(
    `SELECT * FROM daily_report_comments WHERE report_id = $1 ORDER BY created_at ASC`,
    [reportId]
  );
  return rows.map(mapReportComment);
}

export async function listReportComments() {
  const rows = await query<any>(
    `SELECT * FROM daily_report_comments ORDER BY created_at ASC`,
  );
  return rows.map(mapReportComment);
}

export async function createReportComment(
  reportId: string,
  employeeId: string,
  body: string,
) {
  const row = await queryOne<any>(
    `INSERT INTO daily_report_comments (report_id, employee_id, body) VALUES ($1,$2,$3) RETURNING *`,
    [reportId, employeeId, body],
  );

  const report = await findDailyReportById(reportId);
<<<<<<< HEAD
  if (report && report.employee_id !== employeeId) {
    const commenter = await queryOne<any>(
      `SELECT * FROM employees WHERE id = $1`,
      [employeeId],
    );
=======
  if (report && report.employeeId !== employeeId) {
    const commenter = await queryOne<any>(`SELECT * FROM employees WHERE id = $1`, [employeeId]);
>>>>>>> 41e4dd42d738ad8294ae99c8fe8b2175a55bb829
    await notify(
      report.employeeId,
      "daily-report",
      "New comment on your daily report",
      `${commenter?.name ?? "Someone"} commented on your report for ${report.date}.`,
      "report",
      reportId,
    );
  }

  return mapReportComment(row);
}

// Only the comment's own author or an Admin may delete it.
export async function deleteReportComment(
  id: string,
  actorId: string,
  isAdmin: boolean,
) {
  const existing = await queryOne<any>(
    `SELECT * FROM daily_report_comments WHERE id = $1`,
    [id],
  );
  if (!existing) return { ok: false as const, error: "Comment not found." };
  if (existing.employee_id !== actorId && !isAdmin) {
    return {
      ok: false as const,
      error: "You can only delete your own comment.",
    };
  }
  await query(`DELETE FROM daily_report_comments WHERE id = $1`, [id]);
  return { ok: true as const };
}

// ---------------------------------------------------------------------
// Notifications + activity (reads)
// ---------------------------------------------------------------------

export async function listNotificationsForUser(userId: string) {
  const rows = await query<any>(
    `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 200`,
    [userId],
  );
  return rows.map(mapNotification);
}

export async function markNotificationRead(id: string, userId: string) {
  await query(
    `UPDATE notifications SET read = TRUE WHERE id = $1 AND user_id = $2`,
    [id, userId],
  );
}

export async function markAllNotificationsRead(userId: string) {
  await query(`UPDATE notifications SET read = TRUE WHERE user_id = $1`, [
    userId,
  ]);
}

export async function listActivity() {
  const rows = await query<any>(
    `SELECT * FROM activity ORDER BY created_at DESC LIMIT 60`,
  );
  return rows.map(mapActivity);
}
