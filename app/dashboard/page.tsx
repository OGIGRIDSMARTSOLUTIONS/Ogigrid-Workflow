"use client";

import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { MetricsRow } from "@/components/dashboard/MetricsRow";
import { ProjectFocusPanel } from "@/components/dashboard/ProjectFocusPanel";
import { DailyReportsPanel } from "@/components/dashboard/DailyReportsPanel";
import { MeetingsPanel } from "@/components/dashboard/MeetingsPanel";
import { DocumentsPanel } from "@/components/dashboard/DocumentsPanel";
import { ActivityPanel } from "@/components/dashboard/ActivityPanel";
import { useApp } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { computeProjectProgress, isAfter6pm, isOverdue, todayIso } from "@/lib/data";

export default function DashboardPage() {
  const { projects, tasks, employees, meetings, documents, dailyReports, activity } = useApp();
  const { currentUser } = useAuth();

  if (!currentUser) return null;
  const isAdmin = currentUser.role === "Admin";
  const today = todayIso();
  const after6pm = isAfter6pm();

  // Active projects across the team
  const activeProjects = projects.filter((p) => p.status !== "Completed");

  // Active / in-progress tasks across the whole team
  const activeTasks = tasks.filter((t) => t.status === "In Progress" || t.status === "To Do");
  const blockedOrReviewTasks = tasks.filter((t) => t.status === "Blocked" || t.status === "Review");
  const overdueTasks = tasks.filter((t) => isOverdue(t.deadline, t.status));
  const activeEmployees = employees.filter((e) => e.status === "Active");

  // Check if current user has submitted today's daily report
  const hasUserSubmittedToday = dailyReports.some(
    (r) => r.employeeId === currentUser.id && r.date === today
  );

  // Show reminder banner only if after 6pm and unsubmitted
  const showReminderBanner = after6pm && !hasUserSubmittedToday;

  // Sort upcoming meetings first, then recent ended ones
  const nowStr = `${today} ${new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
  const dashboardMeetings = [...meetings]
    .sort((a, b) => {
      const aKey = `${a.date} ${a.time}`;
      const bKey = `${b.date} ${b.time}`;
      const aUpcoming = aKey >= nowStr;
      const bUpcoming = bKey >= nowStr;
      if (aUpcoming && !bUpcoming) return -1;
      if (!aUpcoming && bUpcoming) return 1;
      return aUpcoming ? aKey.localeCompare(bKey) : bKey.localeCompare(aKey);
    })
    .slice(0, 6);

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
    { label: "Active Team Members", value: activeEmployees.length, href: "/employees" },
    { label: "Active Tasks", value: activeTasks.length, href: "/tasks?view=active" },
    { label: "Blocked / In Review", value: blockedOrReviewTasks.length, href: "/tasks?view=blocked" },
    { label: "Active Projects", value: activeProjects.length, href: "/projects" },
  ];

  return (
    <AppShell
      title="Team Dashboard"
      subtitle="Overview of team workload, current assignments, and project status."
    >
      <div className="space-y-6">
        {/* Daily Report Reminder Banner (After 6:00 PM if unsubmitted) */}
        {showReminderBanner && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50/90 via-indigo-50/80 to-slate-50 p-4 shadow-subtle">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-blue-600 text-base text-white shadow-sm">
                📝
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  End of Day Standup Reminder
                </p>
                <p className="text-xs text-slate-600">
                  It's past 6:00 PM and you haven't submitted your daily report for today ({today}). Share what you worked on with the team.
                </p>
              </div>
            </div>
            <Link
              href="/daily-reports"
              className="inline-flex items-center justify-center rounded-md bg-[#0B1120] px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 transition-colors flex-shrink-0"
            >
              Submit Daily Report →
            </Link>
          </div>
        )}

        {/* 1. Team Overview Metrics */}
        <MetricsRow metrics={metrics} />

        {/* Main Modular Dashboard Layout */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {/* Left 2 Columns: Main Workload & Active Projects */}
          <div className="space-y-6 xl:col-span-2">
            <ProjectFocusPanel
              projects={activeProjects}
              tasks={tasks}
              employees={employees}
              documents={documents}
            />
          </div>

          {/* Right Column: Daily Reports, Meetings, Documents, and Activity Feed */}
          <div className="space-y-6">
            <DailyReportsPanel
              employees={reportEmployees}
              submittedIds={submittedTodayIds}
              dailyReports={dailyReports}
              today={today}
            />
            <MeetingsPanel meetings={dashboardMeetings} projects={projects} employees={employees} />
            <DocumentsPanel documents={recentDocuments} projects={projects} />
            <ActivityPanel activity={activity} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
