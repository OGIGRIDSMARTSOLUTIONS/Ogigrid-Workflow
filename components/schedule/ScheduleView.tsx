"use client";

import { useState } from "react";
import Link from "next/link";
import { ScheduleGrid } from "./ScheduleGrid";
import { MeetingDetailPanel } from "./MeetingDetailPanel";
import { TaskDetailPanel } from "@/components/tasks/TaskDetailPanel";
import { NewTaskModal } from "@/components/tasks/NewTaskModal";
import { PrimaryButton, SecondaryButton, EmptyState } from "@/components/ui/FormControls";
import { useApp } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { addDays, formatWeekRange, startOfWeek, todayIso, weekDates } from "@/lib/data";
import { Meeting, Task } from "@/lib/types";

type ScheduleSlot = { employeeId: string; date: string };

export function ScheduleView() {
  const { employees, tasks, projects, meetings } = useApp();
  const { currentUser } = useAuth();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(todayIso()));
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
  const [scheduleSlot, setScheduleSlot] = useState<ScheduleSlot | null>(null);

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
        description="Add team members from the Partners page, then assign tasks or schedule meetings to see them here."
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

  function handleScheduleCell(employeeId: string, date: string) {
    setScheduleSlot({ employeeId, date });
    setSelectedTaskId(null);
    setSelectedMeetingId(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-3">
          <SecondaryButton onClick={() => setWeekStart(addDays(weekStart, -7))}>
            ← Prev
          </SecondaryButton>
          <p className="text-xs sm:text-sm font-semibold text-ink text-center min-w-[140px]">{formatWeekRange(weekStart)}</p>
          <SecondaryButton onClick={() => setWeekStart(addDays(weekStart, 7))}>
            Next →
          </SecondaryButton>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
          {isAdmin && (
            <>
              <Link href="/meetings">
                <SecondaryButton type="button">+ Schedule Meeting</SecondaryButton>
              </Link>
              <PrimaryButton
                type="button"
                onClick={() =>
                  handleScheduleCell(currentUser.id, todayIso())
                }
              >
                + Schedule Task
              </PrimaryButton>
            </>
          )}
          <SecondaryButton onClick={() => setWeekStart(startOfWeek(todayIso()))}>
            This week
          </SecondaryButton>
        </div>
      </div>

      {isAdmin && (
        <p className="text-xs text-ink-faint">
          Click an empty cell to schedule a task for that teammate and day. Select a task or meeting to update progress or reschedule.
        </p>
      )}

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
          isAdmin={isAdmin}
          onSelectTask={handleSelectTask}
          onSelectMeeting={handleSelectMeeting}
          onScheduleCell={isAdmin ? handleScheduleCell : undefined}
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

      {scheduleSlot && (
        <NewTaskModal
          defaultAssigneeId={scheduleSlot.employeeId}
          defaultStartDate={scheduleSlot.date}
          onClose={() => setScheduleSlot(null)}
          onCreated={(task) => {
            setSelectedTaskId(task.id);
            setScheduleSlot(null);
          }}
        />
      )}
    </div>
  );
}
