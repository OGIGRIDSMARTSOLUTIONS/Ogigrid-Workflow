"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Panel } from "@/components/ui/Panel";
import { StatusBadge, PriorityBadge } from "@/components/ui/StatusBadge";
import { EmptyState, SecondaryButton } from "@/components/ui/FormControls";
import { useApp } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { formatDate, formatDateTime } from "@/lib/data";

export default function EmployeeProfilePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { employees, projects, tasks, dailyReports } = useApp();
  const { currentUser } = useAuth();

  const employee = employees.find((e) => e.id === params.id);

  if (!currentUser) return null;
  const isAdmin = currentUser.role === "Admin";
  const isSelf = currentUser.id === params.id;

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

  if (!isAdmin && !isSelf) {
    return (
      <AppShell title="Profile">
        <EmptyState
          title="You don't have access to this profile"
          description="Only the employee themselves or an admin can view this page."
          action={<SecondaryButton onClick={() => router.push("/employees")}>Back to Employees</SecondaryButton>}
        />
      </AppShell>
    );
  }

  const employeeProjects = projects.filter((p) => p.memberIds.includes(employee.id));
  const employeeTasks = tasks.filter((t) => t.assigneeId === employee.id);
  const completedTasks = employeeTasks.filter((t) => t.status === "Completed");
  const activeTasks = employeeTasks.filter((t) => t.status !== "Completed");
  const employeeReports = (isAdmin || isSelf ? dailyReports : []).filter(
    (r) => r.employeeId === employee.id
  );

  return (
    <AppShell title={employee.name} subtitle="Employee profile">
      <div className="mb-2 text-xs text-ink-faint">
        <Link href="/employees" className="hover:text-brand-600 hover:underline">
          Employees
        </Link>{" "}
        / {employee.name}
      </div>
      <SecondaryButton onClick={() => router.push("/employees")} className="mb-4">
        ← Back to Employees
      </SecondaryButton>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <Panel title="Projects">
            {employeeProjects.length === 0 ? (
              <p className="text-sm text-ink-faint">Not a member of any project yet.</p>
            ) : (
              <ul className="space-y-2">
                {employeeProjects.map((project) => (
                  <li key={project.id} className="flex items-center justify-between text-sm">
                    <Link
                      href={`/projects/${project.id}`}
                      className="font-medium text-ink hover:text-brand-600 hover:underline"
                    >
                      {project.name}
                    </Link>
                    <StatusBadge status={project.status} />
                  </li>
                ))}
              </ul>
            )}
          </Panel>

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
                      <td className="py-2">
                        <Link href={`/tasks/${task.id}`} className="hover:text-brand-600 hover:underline">
                          {task.name}
                        </Link>
                      </td>
                      <td className="py-2">
                        <PriorityBadge priority={task.priority} />
                      </td>
                      <td className="py-2">
                        <StatusBadge status={task.status} />
                      </td>
                      <td className="py-2 text-ink-muted">{formatDate(task.deadline)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <p className="mt-3 text-xs text-ink-faint">
              {activeTasks.length} active · {completedTasks.length} completed
            </p>
          </Panel>

          {(isAdmin || isSelf) && (
            <Panel title="Daily Reports">
              {employeeReports.length === 0 ? (
                <p className="text-sm text-ink-faint">No daily reports submitted yet.</p>
              ) : (
                <ul className="space-y-3">
                  {[...employeeReports]
                    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
                    .slice(0, 10)
                    .map((report) => (
                      <li key={report.id} className="border-b border-border pb-3 last:border-0 last:pb-0">
                        <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">
                          {formatDate(report.date)}
                        </p>
                        <p className="mt-1 text-sm text-ink-muted">{report.workedOn || "—"}</p>
                      </li>
                    ))}
                </ul>
              )}
            </Panel>
          )}
        </div>

        <Panel title="Profile" className="h-fit">
          <div className="space-y-4 text-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-brand-100 text-sm font-semibold text-brand-700">
                {employee.initials}
              </div>
              <div>
                <p className="font-semibold text-ink">{employee.name}</p>
                <p className="text-xs text-ink-faint">
                  {employee.role}
                  {employee.isPrimaryAdmin && " · Primary Administrator"}
                </p>
              </div>
            </div>
            <InfoRow label="Email">{employee.email || "—"}</InfoRow>
            <InfoRow label="Departments">
              {employee.departments.length ? employee.departments.join(", ") : "—"}
            </InfoRow>
            <InfoRow label="Status">
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
                className="w-full"
              >
                Manage from Employees page
              </SecondaryButton>
            )}
          </div>
        </Panel>
      </div>
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
