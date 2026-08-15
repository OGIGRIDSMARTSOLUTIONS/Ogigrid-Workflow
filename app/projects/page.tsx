"use client";

import { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Panel } from "@/components/ui/Panel";
import { Modal } from "@/components/ui/Modal";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState, Field, PrimaryButton, SecondaryButton } from "@/components/ui/FormControls";
import { useApp } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/ui/Toast";
import { formatDate, computeProjectProgress, todayIso } from "@/lib/data";
import { TaskStatus } from "@/lib/types";

const emptyForm = {
  name: "",
  description: "",
  status: "To Do" as TaskStatus,
  startDate: todayIso(),
  deadline: "",
  memberIds: [] as string[],
};

export default function ProjectsPage() {
  const { projects, tasks, employees, addProject } = useApp();
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  if (!currentUser) return null;
  const isAdmin = currentUser.role === "Admin";

  const visibleProjects = isAdmin
    ? projects
    : projects.filter((p) => p.memberIds.includes(currentUser.id));

  function projectProgress(projectId: string) {
    const projectTasks = tasks.filter((t) => t.projectId === projectId);
    return computeProjectProgress(projectTasks);
  }

  function toggleMember(id: string) {
    setForm((prev) => ({
      ...prev,
      memberIds: prev.memberIds.includes(id)
        ? prev.memberIds.filter((m) => m !== id)
        : [...prev.memberIds, id],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !currentUser) return;
    try {
      await addProject(form);
      showToast("Project created successfully.");
      setForm(emptyForm);
      setModalOpen(false);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Unable to create project.", "error");
    }
  }

  return (
    <AppShell
      title="Projects"
      subtitle={
        isAdmin
          ? "Track company projects, people, tasks and progress."
          : "Projects you're a member of."
      }
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-ink-muted">
            {visibleProjects.length} {visibleProjects.length === 1 ? "project" : "projects"}
          </p>
          {isAdmin && <PrimaryButton onClick={() => setModalOpen(true)}>+ New Project</PrimaryButton>}
        </div>

        {visibleProjects.length === 0 ? (
          <EmptyState
            title="No projects yet"
            description={
              isAdmin
                ? "Create your first project to start organizing tasks, schedules and progress."
                : "You haven't been added to any projects yet."
            }
            action={
              isAdmin ? (
                <PrimaryButton onClick={() => setModalOpen(true)}>+ Create Project</PrimaryButton>
              ) : undefined
            }
          />
        ) : (
          <Panel noPadding>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-ink-faint">
                  <th className="px-4 py-2 font-medium">Project</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">Progress</th>
                  <th className="px-4 py-2 font-medium">Members</th>
                  <th className="px-4 py-2 font-medium">Start</th>
                  <th className="px-4 py-2 font-medium">Deadline</th>
                </tr>
              </thead>
              <tbody>
                {visibleProjects.map((project) => {
                  const progress = projectProgress(project.id);
                  const members = employees.filter((e) => project.memberIds.includes(e.id));
                  return (
                    <tr key={project.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3">
                        <Link
                          href={`/projects/${project.id}`}
                          className="font-medium text-ink hover:text-brand-600 hover:underline"
                        >
                          {project.name}
                        </Link>
                        {project.description && (
                          <p className="mt-0.5 max-w-xs truncate text-xs text-ink-faint">
                            {project.description}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={project.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-24 overflow-hidden rounded-sm bg-canvas">
                            <div
                              className="h-full bg-brand-500"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-xs text-ink-muted">{progress}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-ink-muted">
                        {members.length ? members.map((m) => m.name).join(", ") : "—"}
                      </td>
                      <td className="px-4 py-3 text-ink-muted">{formatDate(project.startDate)}</td>
                      <td className="px-4 py-3 text-ink-muted">{formatDate(project.deadline)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Panel>
        )}
      </div>

      {modalOpen && (
        <Modal title="New Project" onClose={() => setModalOpen(false)} wide>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Project name">
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
              <Field label="Start date">
                <input
                  type="date"
                  className="input"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
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
                <option value="To Do">To Do</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </Field>

            <Field
              label="Members"
              hint={
                employees.length === 0
                  ? "No employees added yet — add team members first from the Employees page."
                  : undefined
              }
            >
              <div className="flex flex-wrap gap-2">
                {employees.map((employee) => (
                  <button
                    type="button"
                    key={employee.id}
                    onClick={() => toggleMember(employee.id)}
                    className={`rounded-sm border px-2.5 py-1 text-xs font-medium transition-colors ${
                      form.memberIds.includes(employee.id)
                        ? "border-brand-400 bg-brand-50 text-brand-700"
                        : "border-border bg-canvas text-ink-muted hover:border-brand-300"
                    }`}
                  >
                    {employee.name}
                  </button>
                ))}
              </div>
            </Field>

            <div className="flex justify-end gap-2 pt-2">
              <SecondaryButton type="button" onClick={() => setModalOpen(false)}>
                Cancel
              </SecondaryButton>
              <PrimaryButton type="submit">Create Project</PrimaryButton>
            </div>
          </form>
        </Modal>
      )}
    </AppShell>
  );
}
