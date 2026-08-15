"use client";

import { useState } from "react";
import { ScheduleGrid } from "./ScheduleGrid";
import { TaskDetailPanel } from "@/components/tasks/TaskDetailPanel";
import { SecondaryButton, EmptyState } from "@/components/ui/FormControls";
import { useApp } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { addDays, formatWeekRange, startOfWeek, todayIso, weekDates } from "@/lib/data";

export function ScheduleView() {
  const { employees, tasks, projects } = useApp();
  const { currentUser } = useAuth();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(todayIso()));
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  if (!currentUser) return null;
  const isAdmin = currentUser.role === "Admin";

  // Admins see the whole team's schedule; employees only see their own row.
  const visibleEmployees = isAdmin ? employees : employees.filter((e) => e.id === currentUser.id);
  const visibleTasks = isAdmin ? tasks : tasks.filter((t) => t.assigneeId === currentUser.id);

  const dates = weekDates(weekStart);
  const selectedTask = visibleTasks.find((t) => t.id === selectedTaskId) ?? null;
  const assignedTaskCount = visibleTasks.filter((t) => t.assigneeId).length;

  if (visibleEmployees.length === 0) {
    return (
      <EmptyState
        title="No employees added"
        description="Add team members from the Employees page, then assign tasks to see them here."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SecondaryButton onClick={() => setWeekStart(addDays(weekStart, -7))}>
            ← Previous
          </SecondaryButton>
          <p className="text-sm font-medium text-ink">{formatWeekRange(weekStart)}</p>
          <SecondaryButton onClick={() => setWeekStart(addDays(weekStart, 7))}>
            Next →
          </SecondaryButton>
        </div>
        <SecondaryButton onClick={() => setWeekStart(startOfWeek(todayIso()))}>
          This week
        </SecondaryButton>
      </div>

      {assignedTaskCount === 0 && (
        <p className="text-sm text-ink-faint">
          {isAdmin
            ? "No work has been scheduled yet. Assign tasks to employees from a project to see them appear here."
            : "You have no scheduled work this week."}
        </p>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <ScheduleGrid
          employees={visibleEmployees}
          tasks={visibleTasks}
          projects={projects}
          weekDates={dates}
          selectedTaskId={selectedTaskId}
          onSelectTask={(task) => setSelectedTaskId(task.id)}
        />
        <TaskDetailPanel task={selectedTask} onClose={() => setSelectedTaskId(null)} />
      </div>
    </div>
  );
}
