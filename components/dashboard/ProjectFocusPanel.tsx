"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Panel } from "@/components/ui/Panel";
import { StatusBadge, PriorityBadge, DepartmentBadge } from "@/components/ui/StatusBadge";
import { formatDate, isOverdue, computeProjectProgress } from "@/lib/data";
import { Employee, Project, Task, DocumentItem } from "@/lib/types";
import { useAuth } from "@/lib/auth";

type Tab = "overview" | "tasks" | "people";

interface ProjectFocusPanelProps {
  projects: Project[]; // active (non-Completed) projects
  tasks: Task[];
  employees: Employee[];
  documents: DocumentItem[];
}

export function ProjectFocusPanel({ projects, tasks, employees, documents }: ProjectFocusPanelProps) {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === "Admin";

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(projects[0]?.id ?? null);
  const [tab, setTab] = useState<Tab>("tasks");

  const selectedProject = projects.find((p) => p.id === selectedProjectId) ?? null;
  const hasAccess =
    !!selectedProject && (isAdmin || (!!currentUser && selectedProject.memberIds.includes(currentUser.id)));

  const projectTasks = useMemo(
    () => (selectedProject ? tasks.filter((t) => t.projectId === selectedProject.id) : []),
    [tasks, selectedProject]
  );
  const activeTasks = useMemo(
    () => projectTasks.filter((t) => t.status === "To Do" || t.status === "In Progress"),
    [projectTasks]
  );
  const blockedReviewTasks = useMemo(
    () => projectTasks.filter((t) => t.status === "Blocked" || t.status === "Review"),
    [projectTasks]
  );
  const members = useMemo(
    () => (selectedProject ? employees.filter((e) => selectedProject.memberIds.includes(e.id)) : []),
    [employees, selectedProject]
  );
  const projectDocuments = useMemo(
    () => (selectedProject ? documents.filter((d) => d.projectId === selectedProject.id) : []),
    [documents, selectedProject]
  );

  // People assigned to this project's active tasks, each with their tasks here.
  const peopleGroups = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const t of activeTasks) {
      if (!t.assigneeId) continue;
      const list = map.get(t.assigneeId) ?? [];
      list.push(t);
      map.set(t.assigneeId, list);
    }
    return Array.from(map.entries())
      .map(([employeeId, empTasks]) => ({
        employee: employees.find((e) => e.id === employeeId),
        tasks: empTasks.sort((a, b) => a.deadline.localeCompare(b.deadline)),
      }))
      .filter((g) => g.employee)
      .sort((a, b) => a.employee!.name.localeCompare(b.employee!.name));
  }, [activeTasks, employees]);

  if (projects.length === 0) {
    return (
      <Panel title="Projects">
        <p className="text-sm text-ink-faint">
          No active projects yet.{" "}
          <Link href="/projects" className="text-brand-600 hover:underline">
            Create your first project.
          </Link>
        </p>
      </Panel>
    );
  }

  return (
    <Panel title="Projects" noPadding>
      <div className="flex flex-col lg:flex-row">
        {/* Project picker */}
        <div className="lg:w-64 flex-shrink-0 border-b border-border lg:border-b-0 lg:border-r">
          <ul className="flex overflow-x-auto lg:block lg:overflow-visible lg:max-h-[520px] lg:overflow-y-auto">
            {projects.map((project) => {
              const projTasks = tasks.filter((t) => t.projectId === project.id);
              const progress = computeProjectProgress(projTasks);
              const canOpen = isAdmin || (!!currentUser && project.memberIds.includes(currentUser.id));
              const isSelected = project.id === selectedProjectId;
              return (
                <li key={project.id} className="flex-shrink-0 lg:flex-shrink">
                  <button
                    type="button"
                    onClick={() => setSelectedProjectId(project.id)}
                    className={`block w-full min-w-[200px] lg:min-w-0 text-left px-4 py-3 border-b border-border lg:border-b transition-colors ${
                      isSelected ? "bg-brand-50 border-l-2 border-l-brand-600" : "hover:bg-canvas border-l-2 border-l-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className={`text-sm font-medium truncate ${isSelected ? "text-brand-700" : "text-ink"}`}>
                        {project.name}
                      </span>
                      {!canOpen && <span className="text-[10px] text-ink-faint flex-shrink-0">🔒</span>}
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-canvas border border-border/60">
                        <div
                          className={`h-full rounded-full ${progress === 100 ? "bg-emerald-500" : "bg-brand-500"}`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="text-[11px] text-ink-faint">{progress}%</span>
                    </div>
                    <p className="mt-1 text-[11px] text-ink-faint">Target: {formatDate(project.deadline)}</p>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Selected project detail */}
        <div className="flex-1 min-w-0 p-4">
          {selectedProject ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  {hasAccess ? (
                    <Link
                      href={`/projects/${selectedProject.id}`}
                      className="font-semibold text-ink hover:text-brand-600 hover:underline truncate"
                    >
                      {selectedProject.name}
                    </Link>
                  ) : (
                    <span
                      className="font-semibold text-ink-muted inline-flex items-center gap-1.5"
                      title="You are not a member of this project"
                    >
                      {selectedProject.name}
                      <span className="text-[11px] text-ink-faint font-normal">(Locked)</span>
                    </span>
                  )}
                  <StatusBadge status={selectedProject.status} />
                </div>
                {/* Tab toggle */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {(
                    [
                      ["overview", "Overview"],
                      ["tasks", "Tasks"],
                      ["people", "People"],
                    ] as [Tab, string][]
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setTab(value)}
                      className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                        tab === value
                          ? "bg-[#0B1120] text-white shadow-sm"
                          : "bg-panel text-ink-muted border border-border hover:bg-canvas"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {tab === "overview" && (
                <div className="space-y-3">
                  <p className="text-sm text-ink-muted">{selectedProject.description || "No description."}</p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-md border border-border p-2.5">
                      <p className="text-[11px] uppercase tracking-wide text-ink-faint">Progress</p>
                      <p className="mt-0.5 text-lg font-semibold text-ink">
                        {computeProjectProgress(projectTasks)}%
                      </p>
                    </div>
                    <div className="rounded-md border border-border p-2.5">
                      <p className="text-[11px] uppercase tracking-wide text-ink-faint">Active tasks</p>
                      <p className="mt-0.5 text-lg font-semibold text-ink">{activeTasks.length}</p>
                    </div>
                    <div className="rounded-md border border-border p-2.5">
                      <p className="text-[11px] uppercase tracking-wide text-ink-faint">Members</p>
                      <p className="mt-0.5 text-lg font-semibold text-ink">{members.length}</p>
                    </div>
                    <div className="rounded-md border border-border p-2.5">
                      <p className="text-[11px] uppercase tracking-wide text-ink-faint">Documents</p>
                      <p className="mt-0.5 text-lg font-semibold text-ink">{projectDocuments.length}</p>
                    </div>
                  </div>
                  {blockedReviewTasks.length > 0 && (
                    <p className="text-xs font-medium text-amber-700">
                      ⚠ {blockedReviewTasks.length} task{blockedReviewTasks.length === 1 ? "" : "s"} blocked or in review
                    </p>
                  )}
                  <p className="text-xs text-ink-faint">
                    {formatDate(selectedProject.startDate)} → {formatDate(selectedProject.deadline)}
                  </p>
                </div>
              )}

              {tab === "tasks" && (
                <div className="space-y-2">
                  {activeTasks.length === 0 ? (
                    <p className="text-sm text-ink-faint py-4 text-center">No active tasks on this project.</p>
                  ) : (
                    activeTasks
                      .sort((a, b) => a.deadline.localeCompare(b.deadline))
                      .map((task) => {
                        const assignee = employees.find((e) => e.id === task.assigneeId);
                        const overdue = isOverdue(task.deadline, task.status);
                        return (
                          <div
                            key={task.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-sm hover:border-slate-300 transition-all"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <Link
                                href={`/tasks/${task.id}`}
                                className="font-medium text-ink hover:text-brand-600 hover:underline truncate"
                              >
                                {task.name}
                              </Link>
                              <span className="text-xs text-ink-faint flex-shrink-0">
                                {assignee ? assignee.name : "Unassigned"}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                              <PriorityBadge priority={task.priority} />
                              <StatusBadge status={task.status} />
                              <span className="text-xs text-ink-faint">{task.progress}%</span>
                              <span className={`text-xs ${overdue ? "font-semibold text-status-notsubmitted" : "text-ink-faint"}`}>
                                {formatDate(task.deadline)}
                                {overdue && " (Overdue)"}
                              </span>
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              )}

              {tab === "people" && (
                <div className="space-y-3">
                  {peopleGroups.length === 0 ? (
                    <p className="text-sm text-ink-faint py-4 text-center">
                      No one has active tasks on this project.
                    </p>
                  ) : (
                    peopleGroups.map(({ employee, tasks: empTasks }) => (
                      <div key={employee!.id} className="rounded-md border border-border p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#0B1120] text-[11px] font-bold text-blue-300 flex-shrink-0">
                            {employee!.initials}
                          </div>
                          <Link
                            href={`/employees/${employee!.id}`}
                            className="text-sm font-medium text-ink hover:text-brand-600 hover:underline"
                          >
                            {employee!.name}
                          </Link>
                          {employee!.departments.length > 0 && <DepartmentBadge name={employee!.departments[0]} />}
                          <span className="text-xs text-ink-faint ml-auto">
                            {empTasks.length} active {empTasks.length === 1 ? "task" : "tasks"}
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          {empTasks.map((task) => {
                            const overdue = isOverdue(task.deadline, task.status);
                            return (
                              <div
                                key={task.id}
                                className="flex items-center justify-between gap-2 text-xs pl-9"
                              >
                                <Link href={`/tasks/${task.id}`} className="text-ink hover:text-brand-600 hover:underline truncate">
                                  {task.name}
                                </Link>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <StatusBadge status={task.status} />
                                  <span className={overdue ? "font-semibold text-status-notsubmitted" : "text-ink-faint"}>
                                    {formatDate(task.deadline)}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-ink-faint">Select a project to see its details.</p>
          )}
        </div>
      </div>
    </Panel>
  );
}
