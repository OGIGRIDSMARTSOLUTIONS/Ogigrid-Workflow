"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Panel } from "@/components/ui/Panel";
import { StatusBadge, PriorityBadge, DepartmentBadge } from "@/components/ui/StatusBadge";
import { formatDate, isOverdue } from "@/lib/data";
import { Employee, Project, Task, TaskStatus } from "@/lib/types";
import { useAuth } from "@/lib/auth";

interface TeamWorkloadPanelProps {
  employees: Employee[];
  tasks: Task[];
  projects: Project[];
}

export function TeamWorkloadPanel({ employees, tasks, projects }: TeamWorkloadPanelProps) {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === "Admin";
  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState<string>("All");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<"active" | "all" | "blocked">("active");

  const activeEmployees = useMemo(
    () => employees.filter((e) => e.status === "Active"),
    [employees]
  );

  const allDepartments = useMemo(() => {
    const set = new Set<string>();
    for (const emp of activeEmployees) {
      for (const d of emp.departments) {
        set.add(d);
      }
    }
    return Array.from(set).sort();
  }, [activeEmployees]);

  const projectsMap = useMemo(() => {
    const map = new Map<string, Project>();
    for (const p of projects) {
      map.set(p.id, p);
    }
    return map;
  }, [projects]);

  // Tasks grouped by assignee
  const tasksByAssignee = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const t of tasks) {
      if (!t.assigneeId) continue;
      const list = map.get(t.assigneeId) ?? [];
      list.push(t);
      map.set(t.assigneeId, list);
    }
    return map;
  }, [tasks]);

  const unassignedTasks = useMemo(
    () => tasks.filter((t) => !t.assigneeId && t.status !== "Completed"),
    [tasks]
  );

  // Filter employees and their relevant tasks
  const filteredData = useMemo(() => {
    const q = search.trim().toLowerCase();

    return activeEmployees
      .filter((emp) => {
        if (selectedDept !== "All" && !emp.departments.includes(selectedDept)) {
          return false;
        }
        return true;
      })
      .map((emp) => {
        const empTasks = tasksByAssignee.get(emp.id) ?? [];
        const relevantTasks = empTasks.filter((t) => {
          if (selectedStatusFilter === "active" && t.status === "Completed") return false;
          if (selectedStatusFilter === "blocked" && t.status !== "Blocked") return false;
          return true;
        });

        // Group tasks by project
        const tasksByProjectMap = new Map<string, Task[]>();
        for (const t of relevantTasks) {
          const list = tasksByProjectMap.get(t.projectId) ?? [];
          list.push(t);
          tasksByProjectMap.set(t.projectId, list);
        }

        const projectGroups = Array.from(tasksByProjectMap.entries()).map(([projectId, pTasks]) => {
          const project = projectsMap.get(projectId);
          return {
            project,
            tasks: pTasks.sort((a, b) => a.deadline.localeCompare(b.deadline)),
          };
        });

        // Search match: matches employee name, email, department, or any task/project name
        const matchesSearch =
          !q ||
          emp.name.toLowerCase().includes(q) ||
          emp.email.toLowerCase().includes(q) ||
          emp.departments.some((d) => d.toLowerCase().includes(q)) ||
          relevantTasks.some(
            (t) =>
              t.name.toLowerCase().includes(q) ||
              (projectsMap.get(t.projectId)?.name.toLowerCase().includes(q) ?? false)
          );

        return {
          employee: emp,
          activeCount: empTasks.filter((t) => t.status !== "Completed").length,
          completedCount: empTasks.filter((t) => t.status === "Completed").length,
          blockedCount: empTasks.filter((t) => t.status === "Blocked").length,
          projectGroups,
          relevantTasks,
          matchesSearch,
        };
      })
      .filter((item) => item.matchesSearch);
  }, [activeEmployees, selectedDept, search, tasksByAssignee, selectedStatusFilter, projectsMap]);

  return (
    <Panel
      title="Who Is Working on What?"
      subtitle="Real-time breakdown of current assignments and active projects across the team."
    >
      <div className="space-y-4">
        {/* Filter & Search Bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              placeholder="Search member, task, or project..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input w-64 text-sm"
            />
            {allDepartments.length > 0 && (
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="input w-auto text-sm"
              >
                <option value="All">All Departments</option>
                {allDepartments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex items-center gap-1 text-xs">
            <span className="text-ink-faint mr-1 font-medium">Show:</span>
            <button
              onClick={() => setSelectedStatusFilter("active")}
              className={`rounded-sm px-2.5 py-1 font-medium transition-colors ${
                selectedStatusFilter === "active"
                  ? "bg-brand-600 text-white"
                  : "bg-panel text-ink-muted border border-border hover:bg-canvas"
              }`}
            >
              Active Work
            </button>
            <button
              onClick={() => setSelectedStatusFilter("blocked")}
              className={`rounded-sm px-2.5 py-1 font-medium transition-colors ${
                selectedStatusFilter === "blocked"
                  ? "bg-brand-600 text-white"
                  : "bg-panel text-ink-muted border border-border hover:bg-canvas"
              }`}
            >
              Blocked
            </button>
            <button
              onClick={() => setSelectedStatusFilter("all")}
              className={`rounded-sm px-2.5 py-1 font-medium transition-colors ${
                selectedStatusFilter === "all"
                  ? "bg-brand-600 text-white"
                  : "bg-panel text-ink-muted border border-border hover:bg-canvas"
              }`}
            >
              All Tasks
            </button>
          </div>
        </div>

        {/* Member Cards Grid */}
        {filteredData.length === 0 ? (
          <p className="py-6 text-center text-sm text-ink-faint">
            No team members matched the current filters.
          </p>
        ) : (
          <div className="space-y-4">
            {filteredData.map(({ employee, activeCount, blockedCount, projectGroups, relevantTasks }) => {
              const avatarColors = [
                "bg-blue-100 text-blue-700 border-blue-200",
                "bg-indigo-100 text-indigo-700 border-indigo-200",
                "bg-purple-100 text-purple-700 border-purple-200",
                "bg-teal-100 text-teal-700 border-teal-200",
                "bg-amber-100 text-amber-800 border-amber-200",
                "bg-rose-100 text-rose-700 border-rose-200",
              ];
              // Pick deterministic color based on employee name length/id
              const colorIdx = (employee.name.charCodeAt(0) + employee.id.charCodeAt(0)) % avatarColors.length;
              const avatarClass = avatarColors[colorIdx];

              return (
              <div
                key={employee.id}
                className="rounded-lg border border-border bg-panel p-4 shadow-subtle transition-all hover:border-slate-300 hover:shadow-md"
              >
                {/* Employee Header */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-3">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border font-bold text-xs shadow-sm ${avatarClass}`}>
                      {employee.initials}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/employees/${employee.id}`}
                          className="font-semibold text-ink hover:text-brand-600 hover:underline"
                        >
                          {employee.name}
                        </Link>
                        <span
                          className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            employee.role === "Admin"
                              ? "bg-purple-50 text-purple-700 border border-purple-200"
                              : "bg-blue-50 text-blue-700 border border-blue-200"
                          }`}
                        >
                          {employee.role}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-ink-muted mt-1">
                        {employee.departments.length > 0 ? (
                          employee.departments.map((dept) => (
                            <DepartmentBadge key={dept} name={dept} />
                          ))
                        ) : (
                          <span className="text-ink-faint">No department specified</span>
                        )}
                        <span className="text-ink-faint">·</span>
                        <span className="text-ink-faint">{employee.email}</span>
                      </div>
                    </div>
                  </div>

                  {/* Summary Badges */}
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span className="inline-flex items-center gap-1 rounded-sm bg-canvas border border-border px-2 py-0.5 text-xs text-ink-muted">
                      <strong className="text-ink font-semibold">{activeCount}</strong> active{" "}
                      {activeCount === 1 ? "task" : "tasks"}
                    </span>
                    {blockedCount > 0 && (
                      <span className="inline-flex items-center rounded-sm bg-status-notsubmittedBg px-2 py-0.5 text-xs font-semibold text-status-notsubmitted">
                        {blockedCount} blocked
                      </span>
                    )}
                  </div>
                </div>

                {/* Assigned Projects & Tasks */}
                <div className="mt-3">
                  {relevantTasks.length === 0 ? (
                    <p className="text-xs text-ink-faint italic py-1">
                      No {selectedStatusFilter === "blocked" ? "blocked" : "active"} tasks assigned.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {projectGroups.map(({ project, tasks: groupTasks }) => (
                        <div key={project?.id ?? "unknown"} className="rounded-sm bg-canvas/60 p-2.5">
                          {/* Project Header Tag */}
                          <div className="mb-2 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-ink-muted">Project:</span>
                              {project ? (
                                isAdmin || (currentUser && project.memberIds.includes(currentUser.id)) ? (
                                  <Link
                                    href={`/projects/${project.id}`}
                                    className="font-medium text-brand-600 hover:underline"
                                  >
                                    {project.name}
                                  </Link>
                                ) : (
                                  <span
                                    className="font-medium text-ink-muted inline-flex items-center gap-1"
                                    title="You are not a member of this project"
                                  >
                                    {project.name}
                                    <span className="text-[10px] text-ink-faint font-normal">(Locked)</span>
                                  </span>
                                )
                              ) : (
                                <span className="text-ink-faint">Unassigned Project</span>
                              )}
                            </div>
                            {project && (
                              <span className="text-ink-faint text-[11px]">
                                Target: {formatDate(project.deadline)}
                              </span>
                            )}
                          </div>

                          {/* Tasks Table/List */}
                          <div className="space-y-1.5">
                            {groupTasks.map((task) => {
                              const overdue = isOverdue(task.deadline, task.status);
                              return (
                                <div
                                  key={task.id}
                                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded border border-border/80 bg-panel px-3 py-2 text-sm"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <Link
                                      href={`/tasks/${task.id}`}
                                      className="font-medium text-ink hover:text-brand-600 hover:underline truncate"
                                      title={task.name}
                                    >
                                      {task.name}
                                    </Link>
                                    {task.progress > 0 && task.status !== "Completed" && (
                                      <span className="text-[11px] text-ink-faint">
                                        ({task.progress}%)
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto flex-shrink-0">
                                    <PriorityBadge priority={task.priority} />
                                    <StatusBadge status={task.status} />
                                    <span
                                      className={`text-xs ${
                                        overdue
                                          ? "font-semibold text-status-notsubmitted"
                                          : "text-ink-faint"
                                      }`}
                                    >
                                      {formatDate(task.deadline)}
                                      {overdue && " (Overdue)"}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              );
            })}
          </div>
        )}

        {/* Unassigned Work section */}
        {unassignedTasks.length > 0 && selectedStatusFilter !== "blocked" && (
          <div className="mt-6 rounded-md border border-dashed border-border bg-canvas/50 p-4">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                  Unassigned Tasks ({unassignedTasks.length})
                </h4>
              </div>
              <span className="text-xs text-ink-faint">Needs an assignee</span>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {unassignedTasks.map((task) => {
                const project = projectsMap.get(task.projectId);
                return (
                  <div
                    key={task.id}
                    className="flex flex-col justify-between rounded border border-border bg-panel p-2.5 text-xs shadow-subtle"
                  >
                    <div>
                      <Link
                        href={`/tasks/${task.id}`}
                        className="font-medium text-ink hover:text-brand-600 hover:underline block truncate"
                        title={task.name}
                      >
                        {task.name}
                      </Link>
                      <p className="mt-0.5 text-ink-faint truncate">
                        {project ? project.name : "No project"}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <PriorityBadge priority={task.priority} />
                      <span className="text-ink-faint">{formatDate(task.deadline)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Panel>
  );
}
