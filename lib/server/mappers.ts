function toIsoDate(value: Date | string | null): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function toIsoTimestamp(value: Date | string | null): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString();
}

export function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function mapEmployee(row: any) {
  const fullName = (row.name ?? "").trim();
  const firstName = (row.first_name ?? "").trim();
  const lastName = (row.last_name ?? "").trim();
  const fallbackParts = fullName ? fullName.split(/\s+/).filter(Boolean) : [];
  const mappedFirst = firstName || fallbackParts[0] || "";
  const mappedLast = lastName || fallbackParts.slice(1).join(" ");
  const displayName = [mappedFirst, mappedLast].filter(Boolean).join(" ").trim() || fullName || "";

  return {
    id: row.id,
    name: displayName,
    firstName: mappedFirst,
    lastName: mappedLast,
    initials: initialsFromName(displayName || "?"),
    role: row.role,
    email: row.email,
    departments: row.departments ?? [],
    status: row.status,
    isPrimaryAdmin: row.is_primary_admin,
  };
}

export function mapProject(row: any, memberIds: string[]) {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? "",
    status: row.status,
    startDate: toIsoDate(row.start_date),
    deadline: toIsoDate(row.deadline),
    memberIds,
    createdAt: toIsoTimestamp(row.created_at),
  };
}

export function mapTask(row: any) {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? "",
    projectId: row.project_id,
    assigneeId: row.assignee_id,
    status: row.status,
    priority: row.priority,
    startDate: toIsoDate(row.start_date),
    durationDays: row.duration_days,
    deadline: toIsoDate(row.deadline),
    progress: row.progress,
    dependsOnTaskId: row.depends_on_task_id,
    createdAt: toIsoTimestamp(row.created_at),
  };
}

export function mapMeeting(row: any, attendeeIds: string[]) {
  return {
    id: row.id,
    title: row.title,
    date: toIsoDate(row.date),
    time: row.time,
    platform: row.platform ?? "Google Meet",
    meetingLink: row.meeting_link ?? undefined,
    attendeeIds,
    projectId: row.project_id,
    details: row.details ?? "",
  };
}

export function mapDocument(row: any) {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? "",
    projectId: row.project_id,
    fileName: row.file_name ?? undefined,
    fileSize: row.file_size !== null && row.file_size !== undefined ? Number(row.file_size) : undefined,
    mimeType: row.mime_type ?? undefined,
    fileData: row.file_data ?? undefined,
    createdAt: toIsoTimestamp(row.created_at),
    updatedAt: toIsoTimestamp(row.updated_at),
  };
}

export function mapDailyReport(row: any) {
  return {
    id: row.id,
    employeeId: row.employee_id,
    date: toIsoDate(row.date),
    workedOn: row.worked_on ?? "",
    completed: row.completed ?? "",
    remaining: row.remaining ?? "",
    blockers: row.blockers ?? "",
    submittedAt: toIsoTimestamp(row.submitted_at),
  };
}

export function mapReportComment(row: any) {
  return {
    id: row.id,
    reportId: row.report_id,
    employeeId: row.employee_id,
    body: row.body,
    createdAt: toIsoTimestamp(row.created_at),
  };
}

export function mapNotification(row: any) {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    message: row.message,
    relatedType: row.related_type,
    relatedId: row.related_id,
    read: row.read,
    createdAt: toIsoTimestamp(row.created_at),
  };
}

export function mapActivity(row: any) {
  return {
    id: row.id,
    description: row.description,
    timestamp: toIsoTimestamp(row.created_at),
  };
}
