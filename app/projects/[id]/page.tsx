"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Panel } from "@/components/ui/Panel";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  EmptyState,
  Field,
  PrimaryButton,
  SecondaryButton,
  DangerLink,
} from "@/components/ui/FormControls";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { NewTaskModal } from "@/components/tasks/NewTaskModal";
import { TaskDetailPanel } from "@/components/tasks/TaskDetailPanel";
import { useApp } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/ui/Toast";
import { formatDate, computeProjectProgress } from "@/lib/data";
import { TaskStatus } from "@/lib/types";

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const {
    projects,
    tasks,
    employees,
    updateProject,
    deleteProject,
    addProjectMember,
    removeProjectMember,
  } = useApp();
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const project = projects.find((p) => p.id === params.id);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [editingInfo, setEditingInfo] = useState(false);
  const [addMemberId, setAddMemberId] = useState("");
  const [confirmDeleteProject, setConfirmDeleteProject] = useState(false);
  const [removeMemberId, setRemoveMemberId] = useState<string | null>(null);

  if (!currentUser) return null;
  const isAdmin = currentUser.role === "Admin";

  if (!project) {
    return (
      <AppShell title="Project not found">
        <EmptyState
          title="This project doesn't exist"
          description="It may have been removed. Go back to the projects list."
          action={
            <SecondaryButton onClick={() => router.push("/projects")}>
              Back to Projects
            </SecondaryButton>
          }
        />
      </AppShell>
    );
  }

  const isMember = project.memberIds.includes(currentUser.id);
  if (!isAdmin && !isMember) {
    return (
      <AppShell title="Project">
        <EmptyState
          title="You don't have access to this project"
          description="Only project members and admins can view this project."
          action={<SecondaryButton onClick={() => router.push("/projects")}>Back to Projects</SecondaryButton>}
        />
      </AppShell>
    );
  }

  const projectTasks = tasks.filter((t) => t.projectId === project.id);
  const selectedTask = projectTasks.find((t) => t.id === selectedTaskId) ?? null;
  const members = employees.filter((e) => project.memberIds.includes(e.id));
  const nonMembers = employees.filter((e) => !project.memberIds.includes(e.id));
  const progress = computeProjectProgress(projectTasks);

  async function handleAddMember() {
    if (!addMemberId || !currentUser) return;
    try {
      await addProjectMember(project!.id, addMemberId);
      showToast("Member added to project.");
      setAddMemberId("");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Unable to add member.", "error");
    }
  }

  async function handleConfirmRemoveMember() {
    if (!removeMemberId || !currentUser) return;
    try {
      await removeProjectMember(project!.id, removeMemberId);
      showToast("Member removed from project.");
      setRemoveMemberId(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Unable to remove member.", "error");
    }
  }

  async function handleDeleteProject() {
    if (!currentUser) return;
    try {
      await deleteProject(project!.id);
      showToast("Project deleted successfully.");
      router.push("/projects");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Unable to delete project.", "error");
    }
  }

  return (
    <AppShell title={project.name} subtitle="Projects">
      <div className="mb-2 text-xs text-ink-faint">
        <Link href="/projects" className="hover:text-brand-600 hover:underline">
          Projects
        </Link>{" "}
        / {project.name}
      </div>
      <SecondaryButton onClick={() => router.push("/projects")} className="mb-4">
        ← Back to Projects
      </SecondaryButton>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <Panel
            title="Project Info"
            action={
              isAdmin && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setEditingInfo((v) => !v)}
                    className="text-xs font-medium text-brand-600 hover:underline"
                  >
                    {editingInfo ? "Done" : "Edit"}
                  </button>
                  <DangerLink onClick={() => setConfirmDeleteProject(true)}>Delete</DangerLink>
                </div>
              )
            }
          >
            {editingInfo ? (
              <ProjectInfoEditor
                description={project.description}
                status={project.status}
                startDate={project.startDate}
                deadline={project.deadline}
                onSave={async (patch) => {
                  try {
                    await updateProject(project.id, patch);
                    showToast("Project updated successfully.");
                    setEditingInfo(false);
                  } catch (err) {
                    showToast(err instanceof Error ? err.message : "Unable to update project.", "error");
                  }
                }}
              />
            ) : (
              <div className="space-y-3 text-sm">
                <p className="text-ink-muted">
                  {project.description || "No description added yet."}
                </p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <InfoItem label="Status">
                    <StatusBadge status={project.status} />
                  </InfoItem>
                  <InfoItem label="Progress">{progress}%</InfoItem>
                  <InfoItem label="Start">{formatDate(project.startDate)}</InfoItem>
                  <InfoItem label="Deadline">{formatDate(project.deadline)}</InfoItem>
                </div>
              </div>
            )}
          </Panel>

          <Panel title="Members">
            <div className="space-y-3">
              {members.length === 0 ? (
                <p className="text-sm text-ink-faint">No members yet.</p>
              ) : (
                <ul className="space-y-2">
                  {members.map((member) => (
                    <li key={member.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-sm bg-brand-100 text-xs font-semibold text-brand-700">
                          {member.initials}
                        </div>
                        <span className="text-sm text-ink">{member.name}</span>
                      </div>
                      {isAdmin && (
                        <DangerLink onClick={() => setRemoveMemberId(member.id)}>Remove</DangerLink>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              {isAdmin && nonMembers.length > 0 && (
                <div className="flex gap-2 pt-2">
                  <select
                    className="input"
                    value={addMemberId}
                    onChange={(e) => setAddMemberId(e.target.value)}
                  >
                    <option value="">Select an employee</option>
                    {nonMembers.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.name}
                      </option>
                    ))}
                  </select>
                  <SecondaryButton type="button" onClick={handleAddMember} disabled={!addMemberId}>
                    + Add
                  </SecondaryButton>
                </div>
              )}
            </div>
          </Panel>

          <Panel
            title="Tasks"
            action={
              isAdmin && (
                <PrimaryButton onClick={() => setTaskModalOpen(true)}>+ New Task</PrimaryButton>
              )
            }
            noPadding={projectTasks.length > 0}
          >
            {projectTasks.length === 0 ? (
              <EmptyState
                title="No tasks yet"
                description="Create a task to get started."
                action={
                  isAdmin ? (
                    <PrimaryButton onClick={() => setTaskModalOpen(true)}>+ Create Task</PrimaryButton>
                  ) : undefined
                }
              />
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-ink-faint">
                    <th className="px-4 py-2 font-medium">Task</th>
                    <th className="px-4 py-2 font-medium">Assignee</th>
                    <th className="px-4 py-2 font-medium">Status</th>
                    <th className="px-4 py-2 font-medium">Priority</th>
                    <th className="px-4 py-2 font-medium">Deadline</th>
                  </tr>
                </thead>
                <tbody>
                  {projectTasks.map((task) => {
                    const dependsOn = projectTasks.find((t) => t.id === task.dependsOnTaskId);
                    const blocked = !!dependsOn && dependsOn.status !== "Completed";
                    const assignee = employees.find((e) => e.id === task.assigneeId);
                    return (
                      <tr
                        key={task.id}
                        onClick={() => setSelectedTaskId(task.id)}
                        className={`cursor-pointer border-b border-border last:border-0 hover:bg-canvas ${
                          selectedTaskId === task.id ? "bg-brand-50" : ""
                        }`}
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium text-ink">{task.name}</p>
                          {blocked && (
                            <span className="mt-1 inline-block rounded-sm bg-status-notsubmittedBg px-1.5 py-0.5 text-[11px] font-medium text-status-notsubmitted">
                              Waiting on {dependsOn?.name}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-ink-muted">{assignee?.name ?? "Unassigned"}</td>
                        <td className="px-4 py-3">
                          <StatusBadge status={task.status} />
                        </td>
                        <td className="px-4 py-3 text-ink-muted">{task.priority}</td>
                        <td className="px-4 py-3 text-ink-muted">{formatDate(task.deadline)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </Panel>
        </div>

        <TaskDetailPanel task={selectedTask} onClose={() => setSelectedTaskId(null)} />
      </div>

      {taskModalOpen && (
        <NewTaskModal
          projectId={project.id}
          onClose={() => setTaskModalOpen(false)}
          onCreated={(task) => {
            showToast("Task created successfully.");
            setSelectedTaskId(task.id);
          }}
        />
      )}

      {confirmDeleteProject && (
        <ConfirmDialog
          title="Delete project"
          description={`Delete "${project.name}"? All of its tasks will also be removed. This cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={handleDeleteProject}
          onCancel={() => setConfirmDeleteProject(false)}
        />
      )}

      {removeMemberId && (
        <ConfirmDialog
          title="Remove member"
          description={`Remove ${employees.find((e) => e.id === removeMemberId)?.name} from this project?`}
          confirmLabel="Remove"
          onConfirm={handleConfirmRemoveMember}
          onCancel={() => setRemoveMemberId(null)}
        />
      )}
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

function ProjectInfoEditor({
  description,
  status,
  startDate,
  deadline,
  onSave,
}: {
  description: string;
  status: TaskStatus;
  startDate: string;
  deadline: string;
  onSave: (patch: {
    description: string;
    status: TaskStatus;
    startDate: string;
    deadline: string;
  }) => void;
}) {
  const [form, setForm] = useState({ description, status, startDate, deadline });

  return (
    <div className="space-y-4">
      <Field label="Description">
        <textarea
          className="input min-h-[70px] resize-none"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </Field>
      <div className="grid grid-cols-3 gap-3">
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
      <div className="flex justify-end">
        <PrimaryButton type="button" onClick={() => onSave(form)}>
          Save Changes
        </PrimaryButton>
      </div>
    </div>
  );
}
