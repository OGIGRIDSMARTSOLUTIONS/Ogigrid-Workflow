"use client";

import { useEffect, useState } from "react";
import { Panel } from "@/components/ui/Panel";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DangerLink, PrimaryButton } from "@/components/ui/FormControls";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useApp } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/ui/Toast";
import { priorityOptions, statusOptions } from "@/lib/data";
import { Task, TaskPriority, TaskStatus } from "@/lib/types";

interface TaskDetailPanelProps {
  task: Task | null;
  onClose: () => void;
}

export function TaskDetailPanel({ task, onClose }: TaskDetailPanelProps) {
  const { employees, tasks, updateTask, deleteTask } = useApp();
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const [draft, setDraft] = useState<Task | null>(task);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setDraft(task);
  }, [task]);

  if (!task || !draft || !currentUser) {
    return (
      <Panel title="Schedule Details" className="h-fit">
        <p className="text-sm text-ink-faint">
          Select a task or meeting from the schedule to view its details.
        </p>
      </Panel>
    );
  }

  const isAdmin = currentUser.role === "Admin";
  const isOwner = draft.assigneeId === currentUser.id;
  const canEditFull = isAdmin;
  const canEditStatus = isAdmin || isOwner;

  const dependsOn = tasks.find((t) => t.id === draft.dependsOnTaskId);
  const isBlocked = !!dependsOn && dependsOn.status !== "Completed";
  const projectTasks = tasks.filter((t) => t.projectId === draft.projectId && t.id !== draft.id);

  async function handleSave() {
    if (!draft || !currentUser) return;
    const patch: Partial<Task> = canEditFull
      ? {
          name: draft.name,
          description: draft.description,
          assigneeId: draft.assigneeId,
          status: draft.status,
          priority: draft.priority,
          durationDays: draft.durationDays,
          progress: draft.progress,
          dependsOnTaskId: draft.dependsOnTaskId,
        }
      : { status: draft.status, progress: draft.progress };
    try {
      await updateTask(draft.id, patch);
      showToast("Task updated successfully.");
      onClose();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Unable to update task.", "error");
    }
  }

  async function handleDelete() {
    if (!draft || !currentUser) return;
    try {
      await deleteTask(draft.id);
      showToast("Task deleted successfully.");
      setConfirmDelete(false);
      onClose();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Unable to delete task.", "error");
    }
  }

  return (
    <Panel
      title="Task Details"
      action={
        <button onClick={onClose} className="text-xs font-medium text-ink-faint hover:text-ink">
          Close
        </button>
      }
      className="h-fit"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <StatusBadge status={draft.status} />
          {isBlocked && (
            <span className="rounded-sm bg-status-notsubmittedBg px-2 py-0.5 text-xs font-medium text-status-notsubmitted">
              Waiting for dependency
            </span>
          )}
        </div>

        <Field label="Task name">
          {canEditFull ? (
            <input
              className="input"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
          ) : (
            <p className="pt-1.5 text-sm text-ink">{draft.name}</p>
          )}
        </Field>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Assigned employee">
            {canEditFull ? (
              <select
                className="input"
                value={draft.assigneeId ?? ""}
                onChange={(e) => setDraft({ ...draft, assigneeId: e.target.value || null })}
              >
                <option value="">Unassigned</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name}
                  </option>
                ))}
              </select>
            ) : (
              <p className="pt-1.5 text-sm text-ink">
                {employees.find((e) => e.id === draft.assigneeId)?.name ?? "Unassigned"}
              </p>
            )}
          </Field>
          <Field label="Priority">
            {canEditFull ? (
              <select
                className="input"
                value={draft.priority}
                onChange={(e) => setDraft({ ...draft, priority: e.target.value as TaskPriority })}
              >
                {priorityOptions.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            ) : (
              <p className="pt-1.5 text-sm text-ink">{draft.priority}</p>
            )}
          </Field>
        </div>

        <Field label="Status">
          <select
            className="input"
            value={draft.status}
            disabled={!canEditStatus}
            onChange={(e) => setDraft({ ...draft, status: e.target.value as TaskStatus })}
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Start date">
            <p className="pt-1.5 text-sm text-ink">{draft.startDate}</p>
          </Field>
          <Field label="Duration (days)">
            {canEditFull ? (
              <input
                type="number"
                min={1}
                className="input"
                value={draft.durationDays}
                onChange={(e) =>
                  setDraft({ ...draft, durationDays: Number(e.target.value) || 1 })
                }
              />
            ) : (
              <p className="pt-1.5 text-sm text-ink">{draft.durationDays}</p>
            )}
          </Field>
        </div>

        <Field label="Deadline">
          <p className="pt-1.5 text-sm text-ink">{draft.deadline}</p>
        </Field>

        <Field label={`Progress — ${draft.progress}%`}>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            disabled={!canEditStatus}
            className="w-full accent-brand-600"
            value={draft.progress}
            onChange={(e) => setDraft({ ...draft, progress: Number(e.target.value) })}
          />
        </Field>

        <Field label="Depends on">
          {canEditFull ? (
            <select
              className="input"
              value={draft.dependsOnTaskId ?? ""}
              onChange={(e) => setDraft({ ...draft, dependsOnTaskId: e.target.value || null })}
            >
              <option value="">No dependency</option>
              {projectTasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          ) : (
            <p className="pt-1.5 text-sm text-ink">{dependsOn?.name ?? "No dependency"}</p>
          )}
        </Field>

        <Field label="Description">
          {canEditFull ? (
            <textarea
              className="input min-h-[90px] resize-none"
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            />
          ) : (
            <p className="pt-1.5 text-sm text-ink-muted">{draft.description || "—"}</p>
          )}
        </Field>

        <div className="flex items-center justify-between pt-1">
          {canEditFull ? (
            <DangerLink type="button" onClick={() => setConfirmDelete(true)}>
              Delete task
            </DangerLink>
          ) : (
            <span />
          )}
          {(canEditFull || canEditStatus) && (
            <PrimaryButton type="button" onClick={handleSave}>
              Save Changes
            </PrimaryButton>
          )}
        </div>
      </div>

      {confirmDelete && (
        <ConfirmDialog
          title="Delete task"
          description={`Delete "${draft.name}"? This cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </Panel>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink-faint">
        {label}
      </span>
      {children}
    </label>
  );
}
