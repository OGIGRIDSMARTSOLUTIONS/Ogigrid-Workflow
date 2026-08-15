"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Panel } from "@/components/ui/Panel";
import { EmptyState, SecondaryButton } from "@/components/ui/FormControls";
import { TaskDetailPanel } from "@/components/tasks/TaskDetailPanel";
import { useApp } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { formatDate } from "@/lib/data";

export default function TaskDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { tasks, projects, employees } = useApp();
  const { currentUser } = useAuth();

  const task = tasks.find((t) => t.id === params.id);

  if (!currentUser) return null;
  const isAdmin = currentUser.role === "Admin";

  if (!task) {
    return (
      <AppShell title="Task not found">
        <EmptyState
          title="This task doesn't exist"
          description="It may have been deleted."
          action={<SecondaryButton onClick={() => router.push("/tasks")}>Back to Tasks</SecondaryButton>}
        />
      </AppShell>
    );
  }

  if (!isAdmin && task.assigneeId !== currentUser.id) {
    return (
      <AppShell title="Task">
        <EmptyState
          title="You don't have access to this task"
          description="Only the assigned employee or an admin can view this task."
          action={<SecondaryButton onClick={() => router.push("/tasks")}>Back to Tasks</SecondaryButton>}
        />
      </AppShell>
    );
  }

  const project = projects.find((p) => p.id === task.projectId);
  const assignee = employees.find((e) => e.id === task.assigneeId);

  return (
    <AppShell title={task.name} subtitle="Task details">
      <div className="mb-4 text-xs text-ink-faint">
        <Link href="/tasks" className="hover:text-brand-600 hover:underline">
          Tasks
        </Link>{" "}
        {project && (
          <>
            /{" "}
            <Link href={`/projects/${project.id}`} className="hover:text-brand-600 hover:underline">
              {project.name}
            </Link>{" "}
          </>
        )}
        / {task.name}
      </div>

      <SecondaryButton onClick={() => router.back()} className="mb-4">
        ← Back
      </SecondaryButton>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Panel title="Overview">
          <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            <InfoItem label="Project">{project?.name ?? "—"}</InfoItem>
            <InfoItem label="Assignee">{assignee?.name ?? "Unassigned"}</InfoItem>
            <InfoItem label="Start">{formatDate(task.startDate)}</InfoItem>
            <InfoItem label="Deadline">{formatDate(task.deadline)}</InfoItem>
          </div>
          {task.description && (
            <p className="mt-4 text-sm text-ink-muted">{task.description}</p>
          )}
        </Panel>

        <TaskDetailPanel task={task} onClose={() => router.push("/tasks")} />
      </div>
    </AppShell>
  );
}

function InfoItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">{label}</p>
      <div className="mt-0.5 text-sm text-ink">{children}</div>
    </div>
  );
}
