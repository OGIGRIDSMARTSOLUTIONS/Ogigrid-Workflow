"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Panel } from "@/components/ui/Panel";
import { Modal } from "@/components/ui/Modal";
import { EmptyState, Field, PrimaryButton, SecondaryButton } from "@/components/ui/FormControls";
import { DepartmentBadge } from "@/components/ui/StatusBadge";
import { useApp } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/ui/Toast";
import { formatDate, formatDateTime, todayIso } from "@/lib/data";

const emptyForm = {
  date: todayIso(),
  workedOn: "",
  completed: "",
  remaining: "",
  blockers: "",
};

export default function DailyReportsPage() {
  const { dailyReports, employees, addDailyReport } = useApp();
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [tab, setTab] = useState<"all" | "mine">("all");
  const [viewScope, setViewScope] = useState<"latest" | "all_history">("latest");
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState<string>("");

  if (!currentUser) return null;

  function openCreate() {
    setForm(emptyForm);
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUser) return;
    try {
      await addDailyReport(form);
      showToast("Daily report submitted successfully. Well done!");
      setModalOpen(false);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Unable to submit report.", "error");
    }
  }

  // Filter and sort reports
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
        const worked = (r.workedOn || "").toLowerCase();
        const completed = (r.completed || "").toLowerCase();
        const remaining = (r.remaining || "").toLowerCase();
        const blockers = (r.blockers || "").toLowerCase();
        return (
          empName.includes(q) ||
          worked.includes(q) ||
          completed.includes(q) ||
          remaining.includes(q) ||
          blockers.includes(q)
        );
      });
    }

    // Sort descending by submission time
    const sorted = [...list].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));

    // If 'latest' mode is chosen (default), show only each person's most recent report to avoid multiple duplicates/clutter
    if (viewScope === "latest" && !selectedDate && !search.trim()) {
      const seen = new Set<string>();
      const deduped: typeof sorted = [];
      for (const r of sorted) {
        if (!seen.has(r.employeeId)) {
          seen.add(r.employeeId);
          deduped.push(r);
        }
      }
      return deduped;
    }

    return sorted;
  }, [dailyReports, tab, currentUser.id, selectedDate, search, employees, viewScope]);

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
          <div className="flex items-center gap-2">
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

          <PrimaryButton onClick={openCreate}>+ Submit Daily Report</PrimaryButton>
        </div>

        {/* Search and Date Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-panel p-3 text-sm">
          <input
            type="text"
            placeholder="Search by teammate name or report content..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input w-64 text-xs"
          />

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="input w-auto text-xs"
            title="Filter by report date"
          />

          {/* Scope Selector: Latest per person vs Full History */}
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

        {/* Reports Content Stream */}
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
        ) : (
          <div className="space-y-4">
            {filteredReports.map((report) => {
              const employee = employees.find((e) => e.id === report.employeeId);
              const isSelf = employee?.id === currentUser.id;
              const colorIdx = employee ? (employee.name.charCodeAt(0) + employee.id.charCodeAt(0)) % avatarColors.length : 0;
              const avatarClass = avatarColors[colorIdx];

              const hasContent = report.workedOn || report.completed || report.remaining || report.blockers;

              return (
                <div
                  key={report.id}
                  className="rounded-lg border border-border bg-panel p-4 shadow-subtle transition-all hover:border-slate-300 hover:shadow-md space-y-3"
                >
                  {/* Header: Employee info + Date */}
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-3">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border font-bold text-xs shadow-sm ${avatarClass}`}>
                        {employee?.initials ?? "?"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          {employee ? (
                            <Link
                              href={`/employees/${employee.id}`}
                              className="font-semibold text-ink hover:text-brand-600 hover:underline"
                            >
                              {employee.name}
                            </Link>
                          ) : (
                            <span className="font-semibold text-ink">Former Employee</span>
                          )}
                          {isSelf && (
                            <span className="rounded bg-blue-50 px-1.5 py-0.2 text-[10px] font-bold text-blue-700 border border-blue-200">
                              You
                            </span>
                          )}
                          <span
                            className={`inline-flex items-center rounded px-1.5 py-0.2 text-[10px] font-bold uppercase tracking-wider ${
                              employee?.role === "Admin"
                                ? "bg-purple-50 text-purple-700 border border-purple-200"
                                : "bg-slate-100 text-slate-700 border border-slate-200"
                            }`}
                          >
                            {employee?.role || "Employee"}
                          </span>
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
                      {report.submittedAt && (
                        <p className="text-[10px] text-ink-faint">
                          {formatDateTime(report.submittedAt)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Report Body Sections */}
                  {!hasContent ? (
                    <p className="text-xs text-ink-faint italic py-1">No additional details provided in this report.</p>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 pt-1 text-xs">
                      {/* What I worked on */}
                      <div className="rounded-md border border-border/70 bg-canvas/40 p-3 space-y-1">
                        <div className="flex items-center gap-1.5 font-semibold text-ink">
                          <span className="text-sm">🔨</span>
                          <span className="uppercase tracking-wide text-[11px] text-ink-muted">What I Worked On</span>
                        </div>
                        <p className="text-ink text-xs whitespace-pre-wrap leading-relaxed">
                          {report.workedOn || <span className="text-ink-faint italic">None specified</span>}
                        </p>
                      </div>

                      {/* What I completed */}
                      <div className="rounded-md border border-emerald-100 bg-emerald-50/30 p-3 space-y-1">
                        <div className="flex items-center gap-1.5 font-semibold text-emerald-800">
                          <span className="text-sm">✅</span>
                          <span className="uppercase tracking-wide text-[11px] text-emerald-700">What I Completed</span>
                        </div>
                        <p className="text-ink text-xs whitespace-pre-wrap leading-relaxed">
                          {report.completed || <span className="text-ink-faint italic">None specified</span>}
                        </p>
                      </div>

                      {/* What remains */}
                      <div className="rounded-md border border-blue-100 bg-blue-50/30 p-3 space-y-1">
                        <div className="flex items-center gap-1.5 font-semibold text-blue-800">
                          <span className="text-sm">⏳</span>
                          <span className="uppercase tracking-wide text-[11px] text-blue-700">What Remains / Next Steps</span>
                        </div>
                        <p className="text-ink text-xs whitespace-pre-wrap leading-relaxed">
                          {report.remaining || <span className="text-ink-faint italic">None specified</span>}
                        </p>
                      </div>

                      {/* Blockers */}
                      <div className={`rounded-md border p-3 space-y-1 ${
                        report.blockers
                          ? "border-rose-200 bg-rose-50/40"
                          : "border-border/70 bg-canvas/40"
                      }`}>
                        <div className={`flex items-center gap-1.5 font-semibold ${
                          report.blockers ? "text-rose-800" : "text-ink-muted"
                        }`}>
                          <span className="text-sm">🚫</span>
                          <span className="uppercase tracking-wide text-[11px]">Blockers</span>
                        </div>
                        <p className={`text-xs whitespace-pre-wrap leading-relaxed ${
                          report.blockers ? "text-rose-900 font-medium" : "text-ink-faint italic"
                        }`}>
                          {report.blockers || "No blockers reported."}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

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
                placeholder="e.g. Completed unit tests for login API and resolved page export bug..."
              />
            </Field>
            <Field label="What remains" hint="Note planned next steps for tomorrow.">
              <textarea
                className="input min-h-[60px] resize-none"
                value={form.remaining}
                onChange={(e) => setForm({ ...form, remaining: e.target.value })}
                placeholder="e.g. Will integrate Stripe checkout and finalize mobile layout..."
              />
            </Field>
            <Field label="Blockers" hint="Mention anything preventing progress.">
              <textarea
                className="input min-h-[60px] resize-none"
                value={form.blockers}
                onChange={(e) => setForm({ ...form, blockers: e.target.value })}
                placeholder="e.g. Waiting for API credentials or design specs (leave blank if none)..."
              />
            </Field>

            <div className="flex justify-end gap-2 pt-2">
              <SecondaryButton type="button" onClick={() => setModalOpen(false)}>
                Cancel
              </SecondaryButton>
              <PrimaryButton type="submit">Submit Report</PrimaryButton>
            </div>
          </form>
        </Modal>
      )}
    </AppShell>
  );
}
