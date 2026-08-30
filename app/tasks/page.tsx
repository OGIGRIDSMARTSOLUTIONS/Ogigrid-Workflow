"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Panel } from "@/components/ui/Panel";
import { StatusBadge, PriorityBadge } from "@/components/ui/StatusBadge";
import { EmptyState, PrimaryButton } from "@/components/ui/FormControls";
import { NewTaskModal } from "@/components/tasks/NewTaskModal";
import { useApp } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { formatDate, isOverdue } from "@/lib/data";

export default function TasksPage() {
  const { tasks, projects, employees } = useApp();
  const { currentUser } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);

  // Admin-only filter states
  const [search, setSearch] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  if (!currentUser) return null;
  const isAdmin = currentUser.role === "Admin";

  // Base visibility:
  // - Regular employees ONLY see tasks assigned to them.
  // - Admins see all tasks across the workspace.
  const baseTasks = isAdmin
    ? tasks
    : tasks.filter((t) => t.assigneeId === currentUser.id);

  // Admin filter application
  const filteredTasks = useMemo(() => {
    if (!isAdmin) {
      return baseTasks;
    }

    return baseTasks.filter((task) => {
      // Assignee filter
      if (assigneeFilter === "unassigned" && task.assigneeId !== null) return false;
      if (assigneeFilter !== "all" && assigneeFilter !== "unassigned" && task.assigneeId !== assigneeFilter) return false;

      // Project filter
      if (projectFilter !== "all" && task.projectId !== projectFilter) return false;

      // Priority filter
      if (priorityFilter !== "all" && task.priority !== priorityFilter) return false;

      // Status filter
      if (statusFilter !== "all" && task.status !== statusFilter) return false;

      // Search query
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const projectName = projects.find((p) => p.id === task.projectId)?.name.toLowerCase() || "";
        const assigneeName = employees.find((e) => e.id === task.assigneeId)?.name.toLowerCase() || "";
        const matchesName = task.name.toLowerCase().includes(q);
        const matchesDesc = (task.description || "").toLowerCase().includes(q);
        if (!matchesName && !matchesDesc && !projectName.includes(q) && !assigneeName.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [baseTasks, isAdmin, assigneeFilter, projectFilter, priorityFilter, statusFilter, search, projects, employees]);

  const sortedTasks = useMemo(() => {
    return [...filteredTasks].sort((a, b) => a.deadline.localeCompare(b.deadline));
  }, [filteredTasks]);

  return (
    <AppShell
      title="Tasks"
      subtitle={isAdmin ? "All company tasks and assignments." : "Tasks assigned to you."}
    >
      <div className="space-y-4">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-ink-muted">
              {sortedTasks.length} {sortedTasks.length === 1 ? "task" : "tasks"}
            </span>
            {isAdmin && filteredTasks.length !== baseTasks.length && (
              <span className="text-xs text-ink-faint">
                (filtered from {baseTasks.length})
              </span>
            )}
          </div>

          {isAdmin && (
            <PrimaryButton onClick={() => setModalOpen(true)} disabled={projects.length === 0}>
              + New Task
            </PrimaryButton>
          )}
        </div>

        {/* Smart Filter Toolbar (Admin Only) */}
        {isAdmin && (
          <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-panel p-3 text-sm">
            {/* Search */}
            <input
              type="text"
              placeholder="Search task, project, or assignee..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input w-56 text-xs"
            />

            {/* Assignee Filter */}
            <select
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              className="input w-auto text-xs"
            >
              <option value="all">All Assignees</option>
              <option value="unassigned">Unassigned</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>

            {/* Project Filter */}
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="input w-auto text-xs"
            >
              <option value="all">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="input w-auto text-xs"
            >
              <option value="all">All Priorities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input w-auto text-xs"
            >
              <option value="all">All Statuses</option>
              <option value="To Do">To Do</option>
              <option value="In Progress">In Progress</option>
              <option value="Review">Review</option>
              <option value="Blocked">Blocked</option>
              <option value="Completed">Completed</option>
            </select>

            {/* Reset Filters button */}
            {(search || assigneeFilter !== "all" || projectFilter !== "all" || priorityFilter !== "all" || statusFilter !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setAssigneeFilter("all");
                  setProjectFilter("all");
                  setPriorityFilter("all");
                  setStatusFilter("all");
                }}
                className="text-xs text-brand-600 hover:underline font-medium ml-auto"
              >
                Reset filters
              </button>
            )}
          </div>
        )}

        {/* Task List Table */}
        {sortedTasks.length === 0 ? (
          <EmptyState
            title={isAdmin ? "No matching tasks found" : "No tasks assigned to you"}
            description={
              isAdmin
                ? "Try adjusting your filters or search terms."
                : "Tasks assigned to you will appear here."
            }
            action={
              isAdmin && projects.length > 0 ? (
                <PrimaryButton onClick={() => setModalOpen(true)}>+ Create Task</PrimaryButton>
              ) : undefined
            }
          />
        ) : (
          <Panel noPadding>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-ink-faint">
                  <th className="px-4 py-2 font-medium">Task</th>
                  <th className="px-4 py-2 font-medium">Project</th>
                  {isAdmin && <th className="px-4 py-2 font-medium">Assignee</th>}
                  <th className="px-4 py-2 font-medium">Priority</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">Deadline</th>
                </tr>
              </thead>
              <tbody>
                {sortedTasks.map((task) => {
                  const project = projects.find((p) => p.id === task.projectId);
                  const assignee = employees.find((e) => e.id === task.assigneeId);
                  const overdue = isOverdue(task.deadline, task.status);

                  return (
                    <tr key={task.id} className="border-b border-border last:border-0 hover:bg-canvas">
                      <td className="px-4 py-3">
                        <Link
                          href={`/tasks/${task.id}`}
                          className="font-medium text-ink hover:text-brand-600 hover:underline inline-flex items-center gap-1.5"
                        >
                          {task.name}
                        </Link>
                        {task.progress > 0 && task.status !== "Completed" && (
                          <span className="text-[11px] text-ink-faint ml-1">
                            ({task.progress}%)
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-ink-muted">
                        {project ? (
                          <Link href={`/projects/${project.id}`} className="hover:text-brand-600 hover:underline">
                            {project.name}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-3 text-ink-muted">
                          {assignee ? (
                            <span className="inline-flex items-center gap-1.5">
                              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-100 text-[10px] font-bold text-brand-700">
                                {assignee.initials}
                              </span>
                              {assignee.name}
                            </span>
                          ) : (
                            <span className="text-ink-faint italic">Unassigned</span>
                          )}
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <PriorityBadge priority={task.priority} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={task.status} />
                      </td>
                      <td className={`px-4 py-3 ${overdue ? "font-semibold text-status-notsubmitted" : "text-ink-muted"}`}>
                        {formatDate(task.deadline)}
                        {overdue && " (Overdue)"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Panel>
        )}
      </div>

      {modalOpen && <NewTaskModal onClose={() => setModalOpen(false)} />}
    </AppShell>
  );
}
