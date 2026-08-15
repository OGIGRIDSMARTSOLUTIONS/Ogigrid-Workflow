"use client";

import { useState } from "react";
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

  if (!currentUser) return null;
  const isAdmin = currentUser.role === "Admin";

  const visibleTasks = isAdmin ? tasks : tasks.filter((t) => t.assigneeId === currentUser.id);
  const sorted = [...visibleTasks].sort((a, b) => a.deadline.localeCompare(b.deadline));

  return (
    <AppShell
      title="Tasks"
      subtitle={isAdmin ? "All tasks across the company." : "Tasks assigned to you."}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-ink-muted">
            {sorted.length} {sorted.length === 1 ? "task" : "tasks"}
          </p>
          {isAdmin && (
            <PrimaryButton onClick={() => setModalOpen(true)} disabled={projects.length === 0}>
              + New Task
            </PrimaryButton>
          )}
        </div>

        {sorted.length === 0 ? (
          <EmptyState
            title={isAdmin ? "No tasks yet" : "No tasks assigned to you yet"}
            description={
              isAdmin
                ? projects.length === 0
                  ? "Create a project first, then add tasks to it."
                  : "Create a task to get started."
                : "Tasks assigned to you by an admin will appear here."
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
                {sorted.map((task) => {
                  const project = projects.find((p) => p.id === task.projectId);
                  const assignee = employees.find((e) => e.id === task.assigneeId);
                  const overdue = isOverdue(task.deadline, task.status);
                  return (
                    <tr key={task.id} className="border-b border-border last:border-0 hover:bg-canvas">
                      <td className="px-4 py-3">
                        <Link
                          href={`/tasks/${task.id}`}
                          className="font-medium text-ink hover:text-brand-600 hover:underline"
                        >
                          {task.name}
                        </Link>
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
                        <td className="px-4 py-3 text-ink-muted">{assignee?.name ?? "Unassigned"}</td>
                      )}
                      <td className="px-4 py-3">
                        <PriorityBadge priority={task.priority} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={task.status} />
                      </td>
                      <td className={`px-4 py-3 ${overdue ? "font-medium text-status-notsubmitted" : "text-ink-muted"}`}>
                        {formatDate(task.deadline)}
                        {overdue && " · Overdue"}
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
