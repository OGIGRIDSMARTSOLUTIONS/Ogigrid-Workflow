"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Field, PrimaryButton, SecondaryButton } from "@/components/ui/FormControls";
import { useApp } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/ui/Toast";
import { priorityOptions, statusOptions, todayIso } from "@/lib/data";
import { Task, TaskPriority, TaskStatus } from "@/lib/types";

interface NewTaskModalProps {
  projectId?: string;
  onClose: () => void;
  onCreated?: (task: Task) => void;
}

export function NewTaskModal({ projectId: fixedProjectId, onClose, onCreated }: NewTaskModalProps) {
  const { employees, tasks, projects, addTask } = useApp();
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const [selectedProjectId, setSelectedProjectId] = useState(fixedProjectId ?? "");
  const [submitting, setSubmitting] = useState(false);
  const projectId = fixedProjectId ?? selectedProjectId;
  const projectTasks = tasks.filter((t) => t.projectId === projectId);

  const [form, setForm] = useState({
    name: "",
    description: "",
    assigneeId: "",
    status: "To Do" as TaskStatus,
    priority: "Medium" as TaskPriority,
    startDate: todayIso(),
    durationDays: 1,
    deadline: "",
    dependsOnTaskId: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !currentUser || !projectId) return;

    setSubmitting(true);
    try {
      const task = await addTask({
        name: form.name,
        description: form.description,
        projectId,
        assigneeId: form.assigneeId || null,
        status: form.status,
        priority: form.priority,
        startDate: form.startDate,
        durationDays: form.durationDays,
        deadline: form.deadline || form.startDate,
        progress: form.status === "Completed" ? 100 : 0,
        dependsOnTaskId: form.dependsOnTaskId || null,
      });
      onCreated?.(task);
      onClose();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Unable to create task.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title="New Task" onClose={onClose} wide>
      <form onSubmit={handleSubmit} className="space-y-4">
        {!fixedProjectId && (
          <Field label="Project">
            <select
              className="input"
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              required
            >
              <option value="">Select a project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </Field>
        )}
        <Field label="Task name">
          <input
            className="input"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            autoFocus
          />
        </Field>
        <Field label="Description">
          <textarea
            className="input min-h-[70px] resize-none"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Assigned employee"
            hint={employees.length === 0 ? "Add employees first to assign this task." : undefined}
          >
            <select
              className="input"
              value={form.assigneeId}
              onChange={(e) => setForm({ ...form, assigneeId: e.target.value })}
            >
              <option value="">Unassigned</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Priority">
            <select
              className="input"
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value as TaskPriority })}
            >
              {priorityOptions.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Field label="Start date">
            <input
              type="date"
              className="input"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            />
          </Field>
          <Field label="Duration (days)">
            <input
              type="number"
              min={1}
              className="input"
              value={form.durationDays}
              onChange={(e) =>
                setForm({ ...form, durationDays: Number(e.target.value) || 1 })
              }
            />
          </Field>
          <Field label="Deadline">
            <input
              type="date"
              className="input"
              value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
            />
          </Field>
        </div>

        <Field label="Status">
          <select
            className="input"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as TaskStatus })}
          >
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>

        <Field
          label="Depends on"
          hint="Optional. This task will be marked as waiting until the selected task is completed."
        >
          <select
            className="input"
            value={form.dependsOnTaskId}
            onChange={(e) => setForm({ ...form, dependsOnTaskId: e.target.value })}
          >
            <option value="">No dependency</option>
            {projectTasks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </Field>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
          <SecondaryButton type="button" onClick={onClose} disabled={submitting} className="w-full sm:w-auto">
            Cancel
          </SecondaryButton>
          <PrimaryButton type="submit" loading={submitting} loadingText="Creating task..." className="w-full sm:w-auto">
            Create Task
          </PrimaryButton>
        </div>
      </form>
    </Modal>
  );
}
