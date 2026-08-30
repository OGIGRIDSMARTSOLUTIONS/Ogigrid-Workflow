"use client";

import Link from "next/link";
import { Panel } from "@/components/ui/Panel";
import { SubmissionBadge } from "@/components/ui/StatusBadge";
import { DailyReport, Employee } from "@/lib/types";

interface DailyReportsPanelProps {
  employees: Employee[];
  submittedIds: Set<string>;
  dailyReports?: DailyReport[];
  today?: string;
}

export function DailyReportsPanel({
  employees,
  submittedIds,
  dailyReports = [],
  today = "",
}: DailyReportsPanelProps) {
  const submittedCount = employees.filter((e) => submittedIds.has(e.id)).length;

  return (
    <Panel
      title="Team Daily Reports"
      action={
        <Link href="/daily-reports" className="text-xs font-medium text-brand-600 hover:underline">
          View all →
        </Link>
      }
    >
      <div className="mb-2 flex items-center justify-between text-xs text-ink-muted border-b border-border/60 pb-2">
        <span>Today's Updates</span>
        <span className="font-semibold text-ink">
          {submittedCount} of {employees.length} submitted
        </span>
      </div>

      {employees.length === 0 ? (
        <p className="text-sm text-ink-faint">
          No team members added.{" "}
          <Link href="/employees" className="text-brand-600 hover:underline">
            Add team members
          </Link>{" "}
          to start tracking reports.
        </p>
      ) : (
        <ul className="space-y-3">
          {employees.map((employee) => {
            // Find report submitted today, or fallback to their most recent submitted report
            const report =
              dailyReports
                .filter((r) => r.employeeId === employee.id)
                .sort((a, b) => (b.date + b.submittedAt).localeCompare(a.date + a.submittedAt))[0];
            const hasSubmitted = submittedIds.has(employee.id) || !!report;

            return (
              <li
                key={employee.id}
                className="border-b border-border/50 pb-2.5 last:border-0 last:pb-0"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#0B1120] text-[10px] font-bold text-blue-300 ring-1 ring-slate-700">
                      {employee.initials}
                    </div>
                    <span className="text-sm font-medium text-ink truncate">{employee.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <SubmissionBadge submitted={hasSubmitted} />
                  </div>
                </div>

                {hasSubmitted && report && (
                  <div className="mt-2 pl-8 text-xs space-y-2">
                    <div className="rounded-md bg-canvas/80 p-2.5 text-xs border border-border/80 space-y-1.5">
                      {report.workedOn && (
                        <div>
                          <span className="text-[10px] uppercase font-bold tracking-wider text-ink-muted block">🔨 Worked on</span>
                          <p className="text-ink whitespace-pre-wrap">{report.workedOn}</p>
                        </div>
                      )}
                      {report.completed && (
                        <div>
                          <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-700 block">✅ Completed</span>
                          <p className="text-ink whitespace-pre-wrap">{report.completed}</p>
                        </div>
                      )}
                      {report.remaining && (
                        <div>
                          <span className="text-[10px] uppercase font-bold tracking-wider text-blue-700 block">⏳ Next Steps</span>
                          <p className="text-ink whitespace-pre-wrap">{report.remaining}</p>
                        </div>
                      )}
                      {report.blockers && (
                        <div className="rounded bg-rose-50/70 p-1.5 border border-rose-200/60 mt-1">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-rose-700 block">🚫 Blockers</span>
                          <p className="text-rose-950 font-medium whitespace-pre-wrap">{report.blockers}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
