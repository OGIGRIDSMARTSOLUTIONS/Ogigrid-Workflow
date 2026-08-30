"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Panel } from "@/components/ui/Panel";
import { StatusBadge, PriorityBadge, DepartmentBadge } from "@/components/ui/StatusBadge";
import { EmptyState, SecondaryButton } from "@/components/ui/FormControls";
import { useApp } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { formatDate } from "@/lib/data";

function LockIcon({ className = "h-3.5 w-3.5 text-ink-faint" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

export default function EmployeeProfilePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { employees, projects, tasks, dailyReports } = useApp();
  const { currentUser } = useAuth();

  const employee = employees.find((e) => e.id === params.id);

  if (!currentUser) return null;
  const isAdmin = currentUser.role === "Admin";
  const isSelf = currentUser.id === params.id;
  const canViewFullDetails = isAdmin || isSelf;

  if (!employee) {
    return (
      <AppShell title="Employee not found">
        <EmptyState
          title="This employee doesn't exist"
          description="They may have been removed from the team."
          action={<SecondaryButton onClick={() => router.push("/employees")}>Back to Employees</SecondaryButton>}
        />
      </AppShell>
    );
  }

  const employeeProjects = projects.filter((p) => p.memberIds.includes(employee.id));
  const employeeTasks = tasks.filter((t) => t.assigneeId === employee.id);
  const completedTasks = employeeTasks.filter((t) => t.status === "Completed");
  const activeTasks = employeeTasks.filter((t) => t.status !== "Completed");
  const employeeReports = dailyReports.filter((r) => r.employeeId === employee.id);

  return (
    <AppShell
      title={employee.name}
      subtitle={
        isSelf
          ? "Your profile and assigned work."
          : isAdmin
          ? "Admin view: employee details, assignments, and reports."
          : "Teammate member card."
      }
    >
      <div className="mb-2 text-xs text-ink-faint">
        <Link href="/employees" className="hover:text-brand-600 hover:underline">
          Employees
        </Link>{" "}
        / {employee.name}
      </div>

      <div className="flex items-center gap-2 mb-4">
        <SecondaryButton onClick={() => router.push("/employees")}>
          ← Back to Employees
        </SecondaryButton>
        <Link
          href="/dashboard"
          className="rounded-sm border border-border bg-panel px-3 py-1.5 text-xs font-medium text-ink hover:bg-canvas transition-colors"
        >
          View Team Dashboard
        </Link>
      </div>

      {canViewFullDetails ? (
        /* Full detailed view for Admin and Self */
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            {/* Active Projects */}
            <Panel title="Active Projects">
              {employeeProjects.length === 0 ? (
                <p className="text-sm text-ink-faint">Not a member of any project yet.</p>
              ) : (
                <ul className="space-y-2.5">
                  {employeeProjects.map((project) => {
                    const hasProjectAccess = isAdmin || project.memberIds.includes(currentUser.id);
                    return (
                      <li
                        key={project.id}
                        className="flex items-center justify-between text-sm rounded border border-border/70 bg-panel px-3 py-2"
                      >
                        <div>
                          {hasProjectAccess ? (
                            <Link
                              href={`/projects/${project.id}`}
                              className="font-medium text-ink hover:text-brand-600 hover:underline"
                            >
                              {project.name}
                            </Link>
                          ) : (
                            <span
                              className="font-medium text-ink-muted inline-flex items-center gap-1.5"
                              title="You are not a member of this project"
                            >
                              <LockIcon />
                              {project.name}
                              <span className="text-[11px] text-ink-faint font-normal">(Locked)</span>
                            </span>
                          )}
                          {project.description && (
                            <p className="text-xs text-ink-faint truncate max-w-sm">
                              {project.description}
                            </p>
                          )}
                        </div>
                        <StatusBadge status={project.status} />
                      </li>
                    );
                  })}
                </ul>
              )}
            </Panel>

            {/* Assigned Tasks */}
            <Panel title="Assigned Tasks">
              {employeeTasks.length === 0 ? (
                <p className="text-sm text-ink-faint">No tasks assigned yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-ink-faint">
                      <th className="pb-2 font-medium">Task</th>
                      <th className="pb-2 font-medium">Priority</th>
                      <th className="pb-2 font-medium">Status</th>
                      <th className="pb-2 font-medium">Deadline</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employeeTasks.map((task) => (
                      <tr key={task.id} className="border-b border-border last:border-0">
                        <td className="py-2.5">
                          <Link
                            href={`/tasks/${task.id}`}
                            className="font-medium text-ink hover:text-brand-600 hover:underline"
                          >
                            {task.name}
                          </Link>
                        </td>
                        <td className="py-2.5">
                          <PriorityBadge priority={task.priority} />
                        </td>
                        <td className="py-2.5">
                          <StatusBadge status={task.status} />
                        </td>
                        <td className="py-2.5 text-ink-muted">{formatDate(task.deadline)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <p className="mt-3 text-xs text-ink-faint">
                {activeTasks.length} active · {completedTasks.length} completed
              </p>
            </Panel>

            {/* Daily Reports */}
            <Panel title="Daily Reports">
              {employeeReports.length === 0 ? (
                <p className="text-sm text-ink-faint">No daily reports submitted yet.</p>
              ) : (
                <ul className="space-y-3">
                  {[...employeeReports]
                    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
                    .slice(0, 10)
                    .map((report) => (
                      <li key={report.id} className="border-b border-border pb-3 last:border-0 last:pb-0 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold uppercase tracking-wide text-ink">
                            📅 {formatDate(report.date)}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 gap-2 text-xs">
                          {report.workedOn && (
                            <p className="text-ink-muted">
                              <strong className="text-ink font-medium">🔨 Worked on: </strong>
                              {report.workedOn}
                            </p>
                          )}
                          {report.completed && (
                            <p className="text-ink-muted">
                              <strong className="text-emerald-700 font-medium">✅ Completed: </strong>
                              {report.completed}
                            </p>
                          )}
                          {report.remaining && (
                            <p className="text-ink-muted">
                              <strong className="text-blue-700 font-medium">⏳ Next: </strong>
                              {report.remaining}
                            </p>
                          )}
                          {report.blockers && (
                            <p className="text-rose-700 font-medium bg-rose-50 p-1.5 rounded border border-rose-200/60">
                              <strong>🚫 Blockers: </strong>
                              {report.blockers}
                            </p>
                          )}
                        </div>
                      </li>
                    ))}
                </ul>
              )}
            </Panel>
          </div>

          {/* Member Details Sidebar */}
          <Panel title="Member Details" className="h-fit">
            <div className="space-y-4 text-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-brand-100 text-sm font-semibold text-brand-700">
                  {employee.initials}
                </div>
                <div>
                  <p className="font-semibold text-ink">{employee.name}</p>
                  <p className="text-xs text-ink-faint">
                    {employee.role === "Admin" ? "Administrator" : "Employee"}
                    {employee.isPrimaryAdmin && " · Primary"}
                  </p>
                </div>
              </div>

              <InfoRow label="Work Email">{employee.email || "—"}</InfoRow>

              <InfoRow label="Departments">
                {employee.departments.length ? (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {employee.departments.map((dept) => (
                      <DepartmentBadge key={dept} name={dept} />
                    ))}
                  </div>
                ) : (
                  "—"
                )}
              </InfoRow>

              <InfoRow label="Account Status">
                <span
                  className={`inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-medium ${
                    employee.status === "Active"
                      ? "bg-status-completedBg text-status-completed"
                      : "bg-status-notstartedBg text-status-notstarted"
                  }`}
                >
                  {employee.status}
                </span>
              </InfoRow>

              {isAdmin && (
                <SecondaryButton
                  type="button"
                  onClick={() => router.push("/employees")}
                  className="w-full mt-2"
                >
                  Manage in Employees List
                </SecondaryButton>
              )}
            </div>
          </Panel>
        </div>
      ) : (
        /* Read-only member contact card for regular employees */
        <div className="max-w-xl">
          <Panel title="Team Member Profile">
            <div className="space-y-4 text-sm">
              <div className="flex items-center gap-3 pb-3 border-b border-border">
                <div className="flex h-14 w-14 items-center justify-center rounded-sm bg-brand-100 text-base font-bold text-brand-700">
                  {employee.initials}
                </div>
                <div>
                  <h3 className="text-base font-semibold text-ink">{employee.name}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className={`inline-flex items-center rounded-sm px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                        employee.role === "Admin"
                          ? "bg-brand-100 text-brand-700"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {employee.role === "Admin" ? "Administrator" : "Employee"}
                    </span>
                    {employee.isPrimaryAdmin && (
                      <span className="rounded-sm bg-brand-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-700">
                        Primary
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <InfoRow label="Work Email">
                  <span className="text-ink font-medium">{employee.email || "—"}</span>
                </InfoRow>

                <InfoRow label="Account Role">
                  <span className="text-ink">{employee.role}</span>
                </InfoRow>
              </div>

              <InfoRow label="Departments">
                {employee.departments.length ? (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {employee.departments.map((dept) => (
                      <DepartmentBadge key={dept} name={dept} />
                    ))}
                  </div>
                ) : (
                  <span className="text-ink-faint">—</span>
                )}
              </InfoRow>

              <div className="pt-2 border-t border-border flex items-center justify-between text-xs text-ink-faint">
                <span>Status: <strong className="text-ink font-medium">{employee.status}</strong></span>
                <span className="italic">Read-only team profile</span>
              </div>
            </div>
          </Panel>
        </div>
      )}
    </AppShell>
  );
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">{label}</p>
      <div className="mt-0.5 text-ink">{children}</div>
    </div>
  );
}
