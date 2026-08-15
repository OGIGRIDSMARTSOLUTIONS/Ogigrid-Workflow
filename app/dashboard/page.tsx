"use client";

import { AppShell } from "@/components/layout/AppShell";
import { MetricsRow } from "@/components/dashboard/MetricsRow";
import { ActiveProjectsPanel } from "@/components/dashboard/ActiveProjectsPanel";
import { DailyReportsPanel } from "@/components/dashboard/DailyReportsPanel";
import { MeetingsPanel } from "@/components/dashboard/MeetingsPanel";
import { DocumentsPanel } from "@/components/dashboard/DocumentsPanel";
import { ActivityPanel } from "@/components/dashboard/ActivityPanel";
import { useApp } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { isOverdue, computeProjectProgress, todayIso } from "@/lib/data";

export default function DashboardPage() {
  const { projects, tasks, employees, meetings, documents, dailyReports, activity } = useApp();
  const { currentUser } = useAuth();

  if (!currentUser) return null;
  const isAdmin = currentUser.role === "Admin";
  const today = todayIso();

  // Scope every data source to what this role/user is allowed to see.
  const scopedProjects = isAdmin
    ? projects
    : projects.filter((p) => p.memberIds.includes(currentUser.id));
  const scopedTasks = isAdmin ? tasks : tasks.filter((t) => t.assigneeId === currentUser.id);
  const scopedMeetings = isAdmin
    ? meetings
    : meetings.filter(
        (m) =>
          m.attendeeIds.includes(currentUser.id) ||
          (m.projectId && projects.find((p) => p.id === m.projectId)?.memberIds.includes(currentUser.id))
      );
  const scopedDocuments = isAdmin
    ? documents
    : documents.filter((d) => !d.projectId || scopedProjects.some((p) => p.id === d.projectId));
  const scopedReports = isAdmin
    ? dailyReports
    : dailyReports.filter((r) => r.employeeId === currentUser.id);
  const scopedActivity = isAdmin ? activity : activity; // activity is company-wide history, visible to all

  const activeProjects = scopedProjects.filter((p) => p.status !== "Completed");
  const pendingTasks = scopedTasks.filter((t) => t.status !== "Completed");
  const overdueTasks = scopedTasks.filter((t) => isOverdue(t.deadline, t.status));
  const completedTasks = scopedTasks.filter((t) => t.status === "Completed");

  const upcomingMeetings = scopedMeetings
    .filter((m) => m.date >= today)
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
    .slice(0, 5);
  const recentDocuments = [...scopedDocuments]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 5);

  const reportEmployees = isAdmin ? employees : employees.filter((e) => e.id === currentUser.id);
  const submittedTodayIds = new Set(
    dailyReports.filter((r) => r.date === today).map((r) => r.employeeId)
  );
  const reportsSubmittedToday = reportEmployees.filter((e) => submittedTodayIds.has(e.id)).length;
  const reportsMissingToday = reportEmployees.length - reportsSubmittedToday;

  const metrics = isAdmin
    ? [
        { label: "Active Projects", value: activeProjects.length },
        { label: "Pending Tasks", value: pendingTasks.length },
        { label: "Overdue Tasks", value: overdueTasks.length },
        { label: "Reports Missing Today", value: reportsMissingToday },
      ]
    : [
        { label: "My Active Projects", value: activeProjects.length },
        { label: "My Pending Tasks", value: pendingTasks.length },
        { label: "My Overdue Tasks", value: overdueTasks.length },
        { label: "My Completed Tasks", value: completedTasks.length },
      ];

  const projectRows = activeProjects.map((project) => {
    const projectTasks = tasks.filter((t) => t.projectId === project.id);
    const progress = computeProjectProgress(projectTasks);
    return {
      id: project.id,
      name: project.name,
      progress,
      status: project.status,
      deadline: project.deadline,
    };
  });

  return (
    <AppShell
      title="Dashboard"
      subtitle={isAdmin ? "Company workspace overview" : `Welcome back, ${currentUser.name}`}
    >
      <div className="space-y-6">
        <MetricsRow metrics={metrics} />

        <ActiveProjectsPanel projects={projectRows} />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <DailyReportsPanel employees={reportEmployees} submittedIds={submittedTodayIds} />
          <MeetingsPanel meetings={upcomingMeetings} projects={projects} />
          <DocumentsPanel documents={recentDocuments} />
        </div>

        <ActivityPanel activity={scopedActivity} />
      </div>
    </AppShell>
  );
}
