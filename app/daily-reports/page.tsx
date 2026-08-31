"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Panel } from "@/components/ui/Panel";
import { Modal } from "@/components/ui/Modal";
import { DailyReportDetailModal } from "@/components/daily-reports/DailyReportDetailModal";
import { EmptyState, Field, PrimaryButton, SecondaryButton } from "@/components/ui/FormControls";
import { DepartmentBadge } from "@/components/ui/StatusBadge";
import { useApp } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/ui/Toast";
import { formatDate, formatDateTime, todayIso } from "@/lib/data";
import { DailyReport } from "@/lib/types";

const emptyForm = {
  date: todayIso(),
  workedOn: "",
  completed: "",
  remaining: "",
  blockers: "",
};

type ViewMode = "grid" | "cards";
type SortKey = "date" | "employee" | "submittedAt";
type SortDir = "asc" | "desc";

function escapeCsv(value: string): string {
  const safe = value.replace(/"/g, '""');
  return `"${safe}"`;
}

function downloadCsv(rows: DailyReport[], employees: { id: string; name: string }[]) {
  const header = ["Date", "Employee", "Worked On", "Completed", "Remaining", "Blockers", "Submitted At"];
  const lines = rows.map((report) => {
    const employee = employees.find((e) => e.id === report.employeeId);
    return [
      report.date,
      employee?.name ?? "Unknown",
      report.workedOn,
      report.completed,
      report.remaining,
      report.blockers,
      report.submittedAt,
    ]
      .map(escapeCsv)
      .join(",");
  });

  const csv = [header.join(","), ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `daily-reports-${todayIso()}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

function SortHeader({
  label,
  active,
  dir,
  onClick,
}: {
  label: string;
  active: boolean;
  dir: SortDir;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 font-medium hover:text-brand-600 transition-colors ${
        active ? "text-brand-700" : "text-ink-faint"
      }`}
    >
      {label}
      <span className="text-[10px]">{active ? (dir === "asc" ? "▲" : "▼") : "↕"}</span>
    </button>
  );
}

export default function DailyReportsPage() {
  const { dailyReports, employees, addDailyReport } = useApp();
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tab, setTab] = useState<"all" | "mine">("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [viewScope, setViewScope] = useState<"latest" | "all_history">("all_history");
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [openInEditMode, setOpenInEditMode] = useState(false);

  if (!currentUser) return null;

  // Deep-link from notifications: /daily-reports?reportId=...
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reportId = params.get("reportId");
    if (reportId) setSelectedReportId(reportId);
  }, []);

  function openCreate() {
    setForm({ ...emptyForm, date: todayIso() });
    setModalOpen(true);
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "employee" ? "asc" : "desc");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUser || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await addDailyReport(form);
      showToast("Daily report submitted successfully. Well done!");
      setModalOpen(false);
      setForm(emptyForm);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Unable to submit report.", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  const filteredReports = useMemo(() => {
    let list = dailyReports;

    if (tab === "mine") {
      list = list.filter((r) => r.employeeId === currentUser.id);
    }

    if (selectedDate) {
      list = list.filter((r) => r.date === selectedDate);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((r) => {
        const emp = employees.find((e) => e.id === r.employeeId);
        const empName = emp?.name.toLowerCase() || "";
        return (
          empName.includes(q) ||
          (r.workedOn || "").toLowerCase().includes(q) ||
          (r.completed || "").toLowerCase().includes(q) ||
          (r.remaining || "").toLowerCase().includes(q) ||
          (r.blockers || "").toLowerCase().includes(q)
        );
      });
    }

    if (viewScope === "latest" && !selectedDate && !search.trim()) {
      const sorted = [...list].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
      const seen = new Set<string>();
      const deduped: DailyReport[] = [];
      for (const r of sorted) {
        if (!seen.has(r.employeeId)) {
          seen.add(r.employeeId);
          deduped.push(r);
        }
      }
      list = deduped;
    }

    const sorted = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "date") {
        cmp = a.date.localeCompare(b.date);
      } else if (sortKey === "submittedAt") {
        cmp = a.submittedAt.localeCompare(b.submittedAt);
      } else {
        const nameA = employees.find((e) => e.id === a.employeeId)?.name ?? "";
        const nameB = employees.find((e) => e.id === b.employeeId)?.name ?? "";
        cmp = nameA.localeCompare(nameB);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return sorted;
  }, [dailyReports, tab, currentUser.id, selectedDate, search, employees, viewScope, sortKey, sortDir]);

  const selectedReport = filteredReports.find((r) => r.id === selectedReportId)
    ?? dailyReports.find((r) => r.id === selectedReportId)
    ?? null;
  const selectedEmployee = selectedReport
    ? employees.find((e) => e.id === selectedReport.employeeId)
    : undefined;

  const avatarColors = [
    "bg-blue-100 text-blue-700 border-blue-200",
    "bg-indigo-100 text-indigo-700 border-indigo-200",
    "bg-purple-100 text-purple-700 border-purple-200",
    "bg-teal-100 text-teal-700 border-teal-200",
    "bg-amber-100 text-amber-800 border-amber-200",
    "bg-rose-100 text-rose-700 border-rose-200",
  ];

  return (
    <AppShell
      title="Daily Reports"
      subtitle="Team daily standups, progress updates, and blockers."
    >
      <div className="space-y-4">
        {/* Top Action Bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setTab("all")}
              className={`rounded px-3 py-1.5 text-xs font-semibold transition-all ${
                tab === "all"
                  ? "bg-brand-600 text-white shadow-sm"
                  : "bg-panel text-ink-muted border border-border hover:bg-canvas"
              }`}
            >
              All Team Reports ({dailyReports.length})
            </button>
            <button
              type="button"
              onClick={() => setTab("mine")}
              className={`rounded px-3 py-1.5 text-xs font-semibold transition-all ${
                tab === "mine"
                  ? "bg-brand-600 text-white shadow-sm"
                  : "bg-panel text-ink-muted border border-border hover:bg-canvas"
              }`}
            >
              My Reports ({dailyReports.filter((r) => r.employeeId === currentUser.id).length})
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <SecondaryButton type="button" onClick={() => downloadCsv(filteredReports, employees)}>
              ⬇ Export CSV
            </SecondaryButton>
            <PrimaryButton onClick={openCreate}>+ Submit Daily Report</PrimaryButton>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-panel p-3 text-sm">
          <input
            type="text"
            placeholder="Search by teammate name or report content..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input w-full sm:w-64 text-xs"
          />

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="input w-auto text-xs"
            title="Filter by report date"
          />

          <div className="flex items-center gap-1 rounded bg-canvas border border-border p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`rounded px-2.5 py-1 font-medium transition-colors ${
                viewMode === "grid"
                  ? "bg-panel text-ink shadow-subtle font-semibold"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              📊 Grid View
            </button>
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              className={`rounded px-2.5 py-1 font-medium transition-colors ${
                viewMode === "cards"
                  ? "bg-panel text-ink shadow-subtle font-semibold"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              🗂️ Card View
            </button>
          </div>

          {!selectedDate && !search && (
            <div className="flex items-center gap-1 rounded bg-canvas border border-border p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setViewScope("latest")}
                className={`rounded px-2.5 py-1 font-medium transition-colors ${
                  viewScope === "latest"
                    ? "bg-panel text-ink shadow-subtle font-semibold"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                Latest per Person
              </button>
              <button
                type="button"
                onClick={() => setViewScope("all_history")}
                className={`rounded px-2.5 py-1 font-medium transition-colors ${
                  viewScope === "all_history"
                    ? "bg-panel text-ink shadow-subtle font-semibold"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                Full History
              </button>
            </div>
          )}

          {(search || selectedDate) && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setSelectedDate("");
              }}
              className="text-xs text-brand-600 hover:underline font-medium ml-auto"
            >
              Reset filters
            </button>
          )}
        </div>

        {/* Content */}
        {filteredReports.length === 0 ? (
          <EmptyState
            title="No daily reports found"
            description={
              search || selectedDate
                ? "No reports matched your filters. Try clearing the search or date."
                : "No daily reports submitted yet. Submit today's update to get started."
            }
            action={<PrimaryButton onClick={openCreate}>+ Submit Daily Report</PrimaryButton>}
          />
        ) : viewMode === "grid" ? (
          <Panel noPadding>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border bg-canvas text-left">
                    <th className="px-3 py-2.5">
                      <SortHeader label="Date" active={sortKey === "date"} dir={sortDir} onClick={() => toggleSort("date")} />
                    </th>
                    <th className="px-3 py-2.5">
                      <SortHeader label="Employee" active={sortKey === "employee"} dir={sortDir} onClick={() => toggleSort("employee")} />
                    </th>
                    <th className="px-3 py-2.5 font-medium text-ink-faint">Worked On</th>
                    <th className="px-3 py-2.5 font-medium text-ink-faint">Completed</th>
                    <th className="px-3 py-2.5 font-medium text-ink-faint">Remains</th>
                    <th className="px-3 py-2.5 font-medium text-ink-faint">Blockers</th>
                    <th className="px-3 py-2.5">
                      <SortHeader label="Submitted" active={sortKey === "submittedAt"} dir={sortDir} onClick={() => toggleSort("submittedAt")} />
                    </th>
                    <th className="px-3 py-2.5 text-right font-medium text-ink-faint">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReports.map((report) => {
                    const employee = employees.find((e) => e.id === report.employeeId);
                    const isSelf = employee?.id === currentUser.id;
                    const canEdit = isSelf || currentUser.role === "Admin";

                    return (
                      <tr
                        key={report.id}
                        className="border-b border-border last:border-0 hover:bg-brand-50/30 cursor-pointer transition-colors"
                        onClick={() => {
                          setOpenInEditMode(false);
                          setSelectedReportId(report.id);
                        }}
                      >
                        <td className="px-3 py-2.5 align-top font-medium text-ink whitespace-nowrap">
                          {formatDate(report.date)}
                        </td>
                        <td className="px-3 py-2.5 align-top">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-ink">{employee?.name ?? "Unknown"}</span>
                            {isSelf && (
                              <span className="rounded bg-blue-50 px-1 py-0.5 text-[9px] font-bold text-blue-700 border border-blue-200">
                                You
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 align-top max-w-[180px]">
                          <p className="line-clamp-3 text-ink-muted whitespace-pre-wrap">{report.workedOn || "—"}</p>
                        </td>
                        <td className="px-3 py-2.5 align-top max-w-[160px]">
                          <p className="line-clamp-3 text-ink-muted whitespace-pre-wrap">{report.completed || "—"}</p>
                        </td>
                        <td className="px-3 py-2.5 align-top max-w-[160px]">
                          <p className="line-clamp-3 text-ink-muted whitespace-pre-wrap">{report.remaining || "—"}</p>
                        </td>
                        <td className="px-3 py-2.5 align-top max-w-[140px]">
                          <p className={`line-clamp-3 whitespace-pre-wrap ${report.blockers ? "text-rose-700 font-medium" : "text-ink-faint"}`}>
                            {report.blockers || "—"}
                          </p>
                        </td>
                        <td className="px-3 py-2.5 align-top text-ink-faint whitespace-nowrap">
                          {formatDateTime(report.submittedAt)}
                        </td>
                        <td className="px-3 py-2.5 align-top text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                          setOpenInEditMode(false);
                          setSelectedReportId(report.id);
                        }}
                              className="rounded bg-blue-50 border border-blue-200 px-2 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-100"
                            >
                              Open
                            </button>
                            {canEdit && (
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenInEditMode(true);
                                  setSelectedReportId(report.id);
                                }}
                                className="text-[11px] font-medium text-brand-600 hover:underline"
                              >
                                Edit
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Panel>
        ) : (
          <div className="space-y-4">
            {filteredReports.map((report) => {
              const employee = employees.find((e) => e.id === report.employeeId);
              const isSelf = employee?.id === currentUser.id;
              const colorIdx = employee ? (employee.name.charCodeAt(0) + employee.id.charCodeAt(0)) % avatarColors.length : 0;
              const avatarClass = avatarColors[colorIdx];
              const hasContent = report.workedOn || report.completed || report.remaining || report.blockers;

              return (
                <button
                  key={report.id}
                  type="button"
                  onClick={() => {
                    setOpenInEditMode(false);
                    setSelectedReportId(report.id);
                  }}
                  className="w-full text-left rounded-lg border border-border bg-panel p-4 shadow-subtle transition-all hover:border-brand-300 hover:shadow-md space-y-3"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-3">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border font-bold text-xs shadow-sm ${avatarClass}`}>
                        {employee?.initials ?? "?"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-ink">{employee?.name ?? "Former Employee"}</span>
                          {isSelf && (
                            <span className="rounded bg-blue-50 px-1.5 py-0.2 text-[10px] font-bold text-blue-700 border border-blue-200">
                              You
                            </span>
                          )}
                        </div>
                        {employee && employee.departments.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1 mt-1">
                            {employee.departments.map((dept) => (
                              <DepartmentBadge key={dept} name={dept} />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 space-y-1">
                      <span className="inline-flex items-center gap-1 rounded bg-canvas border border-border px-2.5 py-1 text-xs font-semibold text-ink">
                        📅 {formatDate(report.date)}
                      </span>
                      <p className="text-[10px] text-ink-faint">{formatDateTime(report.submittedAt)}</p>
                    </div>
                  </div>

                  {!hasContent ? (
                    <p className="text-xs text-ink-faint italic py-1">No additional details provided.</p>
                  ) : (
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 text-xs">
                      {report.workedOn && (
                        <p><span className="font-semibold text-ink-muted">Worked on:</span> {report.workedOn}</p>
                      )}
                      {report.completed && (
                        <p><span className="font-semibold text-emerald-700">Completed:</span> {report.completed}</p>
                      )}
                      {report.remaining && (
                        <p><span className="font-semibold text-blue-700">Remains:</span> {report.remaining}</p>
                      )}
                      {report.blockers && (
                        <p><span className="font-semibold text-rose-700">Blockers:</span> {report.blockers}</p>
                      )}
                    </div>
                  )}

                  <p className="text-[11px] font-medium text-brand-600">Click to open details & comments →</p>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Submit Modal */}
      {modalOpen && (
        <Modal title="Submit Daily Report" onClose={() => setModalOpen(false)} wide>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Employee">
              <p className="pt-1.5 text-sm font-medium text-ink">{currentUser.name}</p>
            </Field>
            <Field label="Date">
              <input
                type="date"
                className="input"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
              />
            </Field>
            <Field label="What I worked on" hint="Describe tasks and activities tackled today.">
              <textarea
                className="input min-h-[70px] resize-none"
                value={form.workedOn}
                onChange={(e) => setForm({ ...form, workedOn: e.target.value })}
                placeholder="e.g. Worked on the client authentication flow and UI components..."
                required
              />
            </Field>
            <Field label="What I completed" hint="List deliverables or finished pieces.">
              <textarea
                className="input min-h-[60px] resize-none"
                value={form.completed}
                onChange={(e) => setForm({ ...form, completed: e.target.value })}
              />
            </Field>
            <Field label="What remains" hint="Note planned next steps for tomorrow.">
              <textarea
                className="input min-h-[60px] resize-none"
                value={form.remaining}
                onChange={(e) => setForm({ ...form, remaining: e.target.value })}
              />
            </Field>
            <Field label="Blockers" hint="Mention anything preventing progress.">
              <textarea
                className="input min-h-[60px] resize-none"
                value={form.blockers}
                onChange={(e) => setForm({ ...form, blockers: e.target.value })}
                placeholder="Leave blank if none."
              />
            </Field>
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
              <SecondaryButton type="button" onClick={() => setModalOpen(false)} disabled={isSubmitting} className="w-full sm:w-auto">
                Cancel
              </SecondaryButton>
              <PrimaryButton type="submit" loading={isSubmitting} loadingText="Submitting report..." className="w-full sm:w-auto">
                Submit Report
              </PrimaryButton>
            </div>
          </form>
        </Modal>
      )}

      {/* Detail / Comment / Edit Modal */}
      {selectedReport && (
        <DailyReportDetailModal
          report={selectedReport}
          employee={selectedEmployee}
          startInEditMode={openInEditMode}
          onClose={() => {
            setSelectedReportId(null);
            setOpenInEditMode(false);
          }}
        />
      )}
    </AppShell>
  );
}
