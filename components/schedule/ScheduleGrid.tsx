"use client";

import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatWeekdayHeader } from "@/lib/data";
import { Employee, Project, Task } from "@/lib/types";

interface ScheduleGridProps {
  employees: Employee[];
  tasks: Task[];
  projects: Project[];
  weekDates: string[];
  selectedTaskId: string | null;
  onSelectTask: (task: Task) => void;
}

export function ScheduleGrid({
  employees,
  tasks,
  projects,
  weekDates,
  selectedTaskId,
  onSelectTask,
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

                return (
                  <td key={date} className="min-w-[150px] px-2 py-2 align-top">
                    <div className="space-y-1.5">
                      {dayTasks.map((task) => (
                        <button
                          key={task.id}
                          onClick={() => onSelectTask(task)}
                          className={`w-full rounded-sm border px-2.5 py-2 text-left transition-colors ${
                            selectedTaskId === task.id
                              ? "border-brand-400 bg-brand-50"
                              : "border-border bg-canvas hover:border-brand-300 hover:bg-brand-50/50"
                          }`}
                        >
                          <p className="truncate text-sm font-medium text-ink">{task.name}</p>
                          <p className="truncate text-xs text-ink-faint">
                            {projects.find((p) => p.id === task.projectId)?.name ?? "—"}
                          </p>
                          <div className="mt-1.5 flex items-center justify-between">
                            <StatusBadge status={task.status} />
                            <span className="text-[11px] text-ink-faint">
                              {task.durationDays}d
                            </span>
                          </div>
                        </button>
                      ))}
                      {dayTasks.length === 0 && (
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
