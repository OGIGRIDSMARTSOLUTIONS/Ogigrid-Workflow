"use client";

import { useState } from "react";
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
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
            const hasSubmitted = submittedIds.has(employee.id);
            const report = dailyReports.find(
              (r) => r.employeeId === employee.id && (today ? r.date === today : true)
            );
            const isExpanded = expandedId === employee.id;

            return (
              <li
                key={employee.id}
                className="border-b border-border/50 pb-2.5 last:border-0 last:pb-0"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 text-[10px] font-bold text-brand-700">
                      {employee.initials}
                    </div>
                    <span className="text-sm font-medium text-ink truncate">{employee.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <SubmissionBadge submitted={hasSubmitted} />
                    {hasSubmitted && report?.workedOn && (
                      <button
                        type="button"
                        onClick={() => setExpandedId(isExpanded ? null : employee.id)}
                        className="text-[11px] text-brand-600 hover:underline ml-1 font-medium"
                      >
                        {isExpanded ? "Hide" : "Details"}
                      </button>
                    )}
                  </div>
                </div>

                {hasSubmitted && report && (
                  <div className="mt-1.5 pl-8 text-xs">
                    {report.workedOn && (
                      <p className="text-ink-muted line-clamp-2">
                        <strong className="text-ink-faint font-medium">Worked on: </strong>
                        {report.workedOn}
                      </p>
                    )}
                    {isExpanded && (
                      <div className="mt-2 space-y-1 rounded bg-canvas/70 p-2 text-xs border border-border/60">
                        {report.completed && (
                          <p className="text-ink-muted">
                            <strong className="text-emerald-700 font-medium">Completed: </strong>
                            {report.completed}
                          </p>
                        )}
                        {report.remaining && (
                          <p className="text-ink-muted">
                            <strong className="text-brand-700 font-medium">Remaining: </strong>
                            {report.remaining}
                          </p>
                        )}
                        {report.blockers && (
                          <p className="text-ink-muted">
                            <strong className="text-status-notsubmitted font-medium">Blockers: </strong>
                            {report.blockers}
                          </p>
                        )}
                      </div>
                    )}
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
