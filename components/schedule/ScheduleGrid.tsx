"use client";

import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatWeekdayHeader, isOverdue, todayIso } from "@/lib/data";
import { Employee, Meeting, Project, Task } from "@/lib/types";

interface ScheduleGridProps {
  employees: Employee[];
  tasks: Task[];
  meetings?: Meeting[];
  projects: Project[];
  weekDates: string[];
  selectedTaskId: string | null;
  selectedMeetingId?: string | null;
  onSelectTask: (task: Task) => void;
  onSelectMeeting?: (meeting: Meeting) => void;
}

export function ScheduleGrid({
  employees,
  tasks,
  meetings = [],
  projects,
  weekDates,
  selectedTaskId,
  selectedMeetingId,
  onSelectTask,
  onSelectMeeting,
}: ScheduleGridProps) {
  return (
    <div className="overflow-x-auto rounded-md border border-border bg-panel shadow-subtle">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <thead>
          <tr>
            <th className="w-48 border-b border-r border-border bg-canvas px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-ink-faint">
              Employee
            </th>
            {weekDates.map((date) => {
              const { weekday, day } = formatWeekdayHeader(date);
              return (
                <th
                  key={date}
                  className="border-b border-border bg-canvas px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-ink-faint"
                >
                  {weekday} {day}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {employees.map((employee) => (
            <tr key={employee.id} className="border-b border-border last:border-0">
              <td className="border-r border-border px-4 py-3 align-top">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-sm bg-brand-100 text-xs font-semibold text-brand-700">
                    {employee.initials}
                  </div>
                  <div>
                    <p className="font-medium text-ink">{employee.name}</p>
                    <p className="text-xs text-ink-faint">
                      {employee.departments.join(" · ") || "—"}
                    </p>
                  </div>
                </div>
              </td>

              {weekDates.map((date) => {
                const dayTasks = tasks.filter(
                  (t) => t.assigneeId === employee.id && t.startDate === date
                );
                const dayMeetings = meetings.filter(
                  (m) => m.attendeeIds.includes(employee.id) && m.date === date
                );

                const hasItems = dayTasks.length > 0 || dayMeetings.length > 0;

                return (
                  <td key={date} className="min-w-[160px] px-2 py-2 align-top">
                    <div className="space-y-1.5">
                      {/* Meetings */}
                      {dayMeetings.map((meeting) => (
                        <button
                          key={meeting.id}
                          type="button"
                          onClick={() => onSelectMeeting?.(meeting)}
                          className={`w-full rounded-sm border px-2.5 py-2 text-left transition-colors ${
                            selectedMeetingId === meeting.id
                              ? "border-purple-400 bg-purple-50 ring-1 ring-purple-300"
                              : "border-purple-200/90 bg-purple-50/40 hover:border-purple-300 hover:bg-purple-50/80"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="inline-flex items-center gap-1 rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-semibold text-purple-700">
                              <span>📹</span> {meeting.platform || "Meeting"}
                            </span>
                            <span className="text-[11px] font-medium text-purple-700">{meeting.time}</span>
                          </div>
                          <p className="mt-1 truncate text-xs font-medium text-ink">{meeting.title}</p>
                          <p className="truncate text-[11px] text-ink-faint">
                            {projects.find((p) => p.id === meeting.projectId)?.name ?? "General"}
                          </p>
                        </button>
                      ))}

                      {/* Tasks */}
                      {dayTasks.map((task) => {
                        const overdue = isOverdue(task.deadline, task.status);
                        const dueToday = task.deadline === todayIso() && task.status !== "Completed";

                        return (
                          <button
                            key={task.id}
                            type="button"
                            onClick={() => onSelectTask(task)}
                            className={`w-full rounded-md border p-2 text-left transition-all shadow-subtle ${
                              selectedTaskId === task.id
                                ? "border-brand-500 bg-brand-50/70 ring-1 ring-brand-400"
                                : overdue
                                ? "border-rose-300 bg-rose-50/40 hover:bg-rose-50/80"
                                : dueToday
                                ? "border-amber-300 bg-amber-50/40 hover:bg-amber-50/80"
                                : "border-border bg-canvas hover:border-brand-300 hover:bg-brand-50/40"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-1">
                              <p className="truncate text-xs font-semibold text-ink">{task.name}</p>
                              {overdue ? (
                                <span className="flex-shrink-0 rounded bg-rose-100 px-1 py-0.2 text-[9px] font-bold text-rose-700">
                                  Overdue
                                </span>
                              ) : dueToday ? (
                                <span className="flex-shrink-0 rounded bg-amber-100 px-1 py-0.2 text-[9px] font-bold text-amber-800">
                                  Due Today
                                </span>
                              ) : null}
                            </div>
                            <p className="truncate text-[11px] text-ink-faint mt-0.5">
                              {projects.find((p) => p.id === task.projectId)?.name ?? "—"}
                            </p>
                            <div className="mt-1.5 flex items-center justify-between">
                              <StatusBadge status={task.status} />
                              <span className="text-[10px] text-ink-faint font-medium">
                                {task.durationDays}d
                              </span>
                            </div>
                          </button>
                        );
                      })}

                      {!hasItems && (
                        <div className="h-full min-h-[56px] rounded-sm border border-dashed border-border" />
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
