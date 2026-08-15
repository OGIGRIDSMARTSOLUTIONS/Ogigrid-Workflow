"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Panel } from "@/components/ui/Panel";
import { Modal } from "@/components/ui/Modal";
import { EmptyState, Field, PrimaryButton, SecondaryButton } from "@/components/ui/FormControls";
import { useApp } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/ui/Toast";
import { formatDate, todayIso } from "@/lib/data";

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

  if (!currentUser) return null;
  const isAdmin = currentUser.role === "Admin";

  // Employees only ever see and submit their own reports — admins see everyone's.
  const visibleReports = isAdmin
    ? dailyReports
    : dailyReports.filter((r) => r.employeeId === currentUser.id);

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

  const sortedReports = [...visibleReports].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));

  return (
    <AppShell
      title="Daily Reports"
      subtitle={isAdmin ? "Daily work updates submitted by the team." : "Your daily work updates."}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-ink-muted">
            {sortedReports.length} {sortedReports.length === 1 ? "report" : "reports"}
          </p>
          <PrimaryButton onClick={openCreate}>+ Submit Report</PrimaryButton>
        </div>

        {sortedReports.length === 0 ? (
          <EmptyState
            title="No daily reports yet"
            description={
              isAdmin
                ? "Reports submitted by employees will appear here."
                : "Submit your first daily report to get started."
            }
            action={<PrimaryButton onClick={openCreate}>+ Submit Report</PrimaryButton>}
          />
        ) : (
          <div className="space-y-3">
            {sortedReports.map((report) => {
              const employee = employees.find((e) => e.id === report.employeeId);
              return (
                <Panel key={report.id} className="h-fit">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-ink">
                        {isAdmin ? employee?.name ?? "Former employee" : "You"}
                      </p>
                      <p className="text-xs text-ink-faint">{formatDate(report.date)}</p>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <ReportField label="What I worked on" value={report.workedOn} />
                    <ReportField label="What I completed" value={report.completed} />
                    <ReportField label="What remains" value={report.remaining} />
                    <ReportField label="Blockers" value={report.blockers} />
                  </div>
                </Panel>
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
              />
            </Field>

            <Field label="What I worked on">
              <textarea
                className="input min-h-[60px] resize-none"
                value={form.workedOn}
                onChange={(e) => setForm({ ...form, workedOn: e.target.value })}
                placeholder="Describe the work done today"
              />
            </Field>
            <Field label="What I completed">
              <textarea
                className="input min-h-[60px] resize-none"
                value={form.completed}
                onChange={(e) => setForm({ ...form, completed: e.target.value })}
                placeholder="List finished pieces or updates"
              />
            </Field>
            <Field label="What remains">
              <textarea
                className="input min-h-[60px] resize-none"
                value={form.remaining}
                onChange={(e) => setForm({ ...form, remaining: e.target.value })}
                placeholder="Note next steps for tomorrow"
              />
            </Field>
            <Field label="Blockers">
              <textarea
                className="input min-h-[60px] resize-none"
                value={form.blockers}
                onChange={(e) => setForm({ ...form, blockers: e.target.value })}
                placeholder="Mention anything preventing progress"
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

function ReportField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">{label}</p>
      <p className="mt-0.5 text-sm text-ink-muted">{value || "—"}</p>
    </div>
  );
}
