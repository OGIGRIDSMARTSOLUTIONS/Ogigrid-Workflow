"use client";

import { useState } from "react";
import { ScheduleGrid } from "./ScheduleGrid";
import { MeetingDetailPanel } from "./MeetingDetailPanel";
import { TaskDetailPanel } from "@/components/tasks/TaskDetailPanel";
import { SecondaryButton, EmptyState } from "@/components/ui/FormControls";
import { useApp } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { addDays, formatWeekRange, startOfWeek, todayIso, weekDates } from "@/lib/data";
import { Meeting, Task } from "@/lib/types";

export function ScheduleView() {
  const { employees, tasks, projects, meetings } = useApp();
  const { currentUser } = useAuth();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(todayIso()));
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);

  if (!currentUser) return null;
  const isAdmin = currentUser.role === "Admin";

  // Admins see the whole team's schedule; employees only see their own row.
  const visibleEmployees = isAdmin ? employees : employees.filter((e) => e.id === currentUser.id);
  const visibleTasks = isAdmin ? tasks : tasks.filter((t) => t.assigneeId === currentUser.id);
  const visibleMeetings = isAdmin
    ? meetings
    : meetings.filter((m) => m.attendeeIds.includes(currentUser.id));

  const dates = weekDates(weekStart);
  const selectedTask = visibleTasks.find((t) => t.id === selectedTaskId) ?? null;
  const selectedMeeting = visibleMeetings.find((m) => m.id === selectedMeetingId) ?? null;

  const weekTasksCount = visibleTasks.filter(
    (t) => t.assigneeId && dates.includes(t.startDate)
  ).length;
  const weekMeetingsCount = visibleMeetings.filter((m) => dates.includes(m.date)).length;
  const totalScheduledItems = weekTasksCount + weekMeetingsCount;

  if (visibleEmployees.length === 0) {
    return (
      <EmptyState
        title="No employees added"
        description="Add team members from the Employees page, then assign tasks or schedule meetings to see them here."
      />
    );
  }

  function handleSelectTask(task: Task) {
    setSelectedTaskId(task.id);
    setSelectedMeetingId(null);
  }

  function handleSelectMeeting(meeting: Meeting) {
    setSelectedMeetingId(meeting.id);
    setSelectedTaskId(null);
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

      {totalScheduledItems === 0 && (
        <p className="text-sm text-ink-faint">
          {isAdmin
            ? "No tasks or meetings have been scheduled for this week."
            : "You have no scheduled tasks or meetings this week."}
        </p>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <ScheduleGrid
          employees={visibleEmployees}
          tasks={visibleTasks}
          meetings={visibleMeetings}
          projects={projects}
          weekDates={dates}
          selectedTaskId={selectedTaskId}
          selectedMeetingId={selectedMeetingId}
          onSelectTask={handleSelectTask}
          onSelectMeeting={handleSelectMeeting}
        />
        {selectedMeeting ? (
          <MeetingDetailPanel
            meeting={selectedMeeting}
            onClose={() => setSelectedMeetingId(null)}
          />
        ) : (
          <TaskDetailPanel
            task={selectedTask}
            onClose={() => setSelectedTaskId(null)}
          />
        )}
      </div>
    </div>
  );
}
