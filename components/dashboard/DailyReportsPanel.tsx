"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Panel } from "@/components/ui/Panel";
import { SubmissionBadge } from "@/components/ui/StatusBadge";
import { DailyReportDetailModal } from "@/components/daily-reports/DailyReportDetailModal";
import { formatDate } from "@/lib/data";
import { DailyReport, Employee } from "@/lib/types";

interface DailyReportsPanelProps {
  employees: Employee[];
  submittedIds: Set<string>;
  dailyReports?: DailyReport[];
  today?: string;
}

type SortDir = "newest" | "oldest";

export function DailyReportsPanel({
  employees,
  submittedIds,
  dailyReports = [],
  today = "",
}: DailyReportsPanelProps) {
  const [sortDir, setSortDir] = useState<SortDir>("newest");
  const [selectedReport, setSelectedReport] = useState<DailyReport | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | undefined>(undefined);

  const submittedCount = employees.filter((e) => submittedIds.has(e.id)).length;

  const rows = useMemo(() => {
    const list = employees.map((employee) => {
      const reportsForEmployee = dailyReports
        .filter((r) => r.employeeId === employee.id)
        .sort((a, b) => (b.date + b.submittedAt).localeCompare(a.date + a.submittedAt));

      const todayReport = today
        ? reportsForEmployee.find((r) => r.date === today)
        : undefined;
      const report = todayReport ?? reportsForEmployee[0] ?? null;
      const submittedToday = submittedIds.has(employee.id);

      return {
        employee,
        report,
        submittedToday,
        hasReport: !!report,
      };
    });

    return list.sort((a, b) => {
      if (!a.report && !b.report) return a.employee.name.localeCompare(b.employee.name);
      if (!a.report) return 1;
      if (!b.report) return -1;
      const cmp = a.report.date.localeCompare(b.report.date);
      return sortDir === "newest" ? -cmp : cmp;
    });
  }, [employees, dailyReports, submittedIds, today, sortDir]);

  function openReport(report: DailyReport, employee: Employee) {
    setSelectedReport(report);
    setSelectedEmployee(employee);
  }

  return (
    <>
      <Panel
        title="Team Daily Reports"
        action={
          <Link href="/daily-reports" className="text-xs font-medium text-brand-600 hover:underline">
            View all →
          </Link>
        }
      >
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs text-ink-muted border-b border-border/60 pb-2">
          <span>Today&apos;s Updates</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSortDir((d) => (d === "newest" ? "oldest" : "newest"))}
              className="rounded border border-border bg-canvas px-2 py-0.5 text-[11px] font-medium text-ink-muted hover:text-brand-600 hover:border-brand-300 transition-colors"
              title="Sort reports by date"
            >
              Date: {sortDir === "newest" ? "Newest ↓" : "Oldest ↑"}
            </button>
            <span className="font-semibold text-ink">
              {submittedCount} of {employees.length} submitted
            </span>
          </div>
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
          <ul className="space-y-2">
            {rows.map(({ employee, report, submittedToday, hasReport }) => (
              <li key={employee.id} className="border-b border-border/50 pb-2 last:border-0 last:pb-0">
                {hasReport && report ? (
                  <button
                    type="button"
                    onClick={() => openReport(report, employee)}
                    className="w-full rounded-md px-1 py-1.5 text-left transition-colors hover:bg-brand-50/50"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#0B1120] text-[10px] font-bold text-blue-300 ring-1 ring-slate-700">
                          {employee.initials}
                        </div>
                        <div className="min-w-0">
                          <span className="text-sm font-medium text-ink truncate block">
                            {employee.name}
                          </span>
                          <span className="text-[10px] text-ink-faint">
                            {formatDate(report.date)}
                            {report.date !== today && today ? " · latest" : ""}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <SubmissionBadge submitted={submittedToday} />
                        <span className="text-[10px] font-medium text-brand-600">Open →</span>
                      </div>
                    </div>
                  </button>
                ) : (
                  <div className="flex items-center justify-between gap-2 px-1 py-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#0B1120] text-[10px] font-bold text-blue-300 ring-1 ring-slate-700">
                        {employee.initials}
                      </div>
                      <span className="text-sm font-medium text-ink truncate">{employee.name}</span>
                    </div>
                    <SubmissionBadge submitted={false} />
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {selectedReport && (
        <DailyReportDetailModal
          report={selectedReport}
          employee={selectedEmployee}
          onClose={() => {
            setSelectedReport(null);
            setSelectedEmployee(undefined);
          }}
        />
      )}
    </>
  );
}
