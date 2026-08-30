"use client";

import { AppShell } from "@/components/layout/AppShell";
import { MetricsRow } from "@/components/dashboard/MetricsRow";
import { TeamWorkloadPanel } from "@/components/dashboard/TeamWorkloadPanel";
import { ActiveProjectsPanel } from "@/components/dashboard/ActiveProjectsPanel";
import { DailyReportsPanel } from "@/components/dashboard/DailyReportsPanel";
import { MeetingsPanel } from "@/components/dashboard/MeetingsPanel";
import { DocumentsPanel } from "@/components/dashboard/DocumentsPanel";
import { ActivityPanel } from "@/components/dashboard/ActivityPanel";
import { useApp } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { computeProjectProgress, todayIso } from "@/lib/data";

export default function DashboardPage() {
  const { projects, tasks, employees, meetings, documents, dailyReports, activity } = useApp();
  const { currentUser } = useAuth();

  if (!currentUser) return null;
  const isAdmin = currentUser.role === "Admin";
  const today = todayIso();

  // Active projects across the team
  const activeProjects = projects.filter((p) => p.status !== "Completed");

  // Active / in-progress tasks across the whole team
  const activeTasks = tasks.filter((t) => t.status === "In Progress" || t.status === "To Do");
  const blockedOrReviewTasks = tasks.filter((t) => t.status === "Blocked" || t.status === "Review");
  const activeEmployees = employees.filter((e) => e.status === "Active");

  // Recent & upcoming meetings
  const dashboardMeetings = [...meetings]
    .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time))
    .slice(0, 5);

  // Recent documents
  const recentDocuments = [...documents]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 5);

  // Daily reports status across the entire team for the dashboard
  const reportEmployees = activeEmployees;
  const submittedTodayIds = new Set(
    dailyReports.filter((r) => r.date === today).map((r) => r.employeeId)
  );

  // Unified team overview metrics
  const metrics = [
    { label: "Active Team Members", value: activeEmployees.length },
    { label: "Active Tasks", value: activeTasks.length },
    { label: "Blocked / In Review", value: blockedOrReviewTasks.length },
    { label: "Active Projects", value: activeProjects.length },
  ];

  const projectRows = activeProjects.map((project) => {
    const projectTasks = tasks.filter((t) => t.projectId === project.id);
    const progress = computeProjectProgress(projectTasks);
    const hasAccess = isAdmin || project.memberIds.includes(currentUser.id);
    return {
      id: project.id,
      name: project.name,
      progress,
      status: project.status,
      deadline: project.deadline,
      hasAccess,
    };
  });

  return (
    <AppShell
      title="Team Dashboard"
      subtitle="Overview of team workload, current assignments, and project status."
    >
      <div className="space-y-6">
        {/* 1. Team Overview Metrics */}
        <MetricsRow metrics={metrics} />

        {/* 2. Main Section: "Who Is Working on What?" */}
        <TeamWorkloadPanel
          employees={employees}
          tasks={tasks}
          projects={projects}
        />

        {/* 3. Supporting Sections */}
        <ActiveProjectsPanel projects={projectRows} />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <DailyReportsPanel
            employees={reportEmployees}
            submittedIds={submittedTodayIds}
            dailyReports={dailyReports}
            today={today}
          />
          <MeetingsPanel meetings={dashboardMeetings} projects={projects} employees={employees} />
          <DocumentsPanel documents={recentDocuments} projects={projects} />
        </div>

        <ActivityPanel activity={activity} />
      </div>
    </AppShell>
  );
}
