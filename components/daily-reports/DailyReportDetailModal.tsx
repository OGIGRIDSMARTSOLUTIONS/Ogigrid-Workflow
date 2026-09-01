"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Modal } from "@/components/ui/Modal";
import { Field, PrimaryButton, SecondaryButton } from "@/components/ui/FormControls";
import { DepartmentBadge } from "@/components/ui/StatusBadge";
import { useApp } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/ui/Toast";
import { formatDate, formatDateTime } from "@/lib/data";
import { DailyReport, Employee, ReportComment } from "@/lib/types";

type ReportForm = {
  date: string;
  workedOn: string;
  completed: string;
  remaining: string;
  blockers: string;
};

function toForm(report: DailyReport): ReportForm {
  return {
    date: report.date,
    workedOn: report.workedOn,
    completed: report.completed,
    remaining: report.remaining,
    blockers: report.blockers,
  };
}

export function DailyReportDetailModal({
  report,
  employee,
  startInEditMode = false,
  onClose,
}: {
  report: DailyReport;
  employee?: Employee;
  startInEditMode?: boolean;
  onClose: () => void;
}) {
  const { employees, updateDailyReport, addReportComment } = useApp();
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [comments, setComments] = useState<ReportComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [editing, setEditing] = useState(startInEditMode);
  const [savingEdit, setSavingEdit] = useState(false);
  const [form, setForm] = useState<ReportForm>(() => toForm(report));

  const isOwner = currentUser?.id === report.employeeId;
  const isAdmin = currentUser?.role === "Admin";
  const canEdit = isOwner || isAdmin;

  useEffect(() => {
    setForm(toForm(report));
    setEditing(startInEditMode);
  }, [report, startInEditMode]);

  useEffect(() => {
    let cancelled = false;
    async function loadComments() {
      setLoadingComments(true);
      try {
        const res = await fetch(`/api/daily-reports/${report.id}/comments`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Unable to load comments.");
        if (!cancelled) setComments(data.comments ?? []);
      } catch (err) {
        if (!cancelled) {
          showToast(err instanceof Error ? err.message : "Unable to load comments.", "error");
        }
      } finally {
        if (!cancelled) setLoadingComments(false);
      }
    }
    loadComments();
    return () => {
      cancelled = true;
    };
  }, [report.id, showToast]);

  async function handlePostComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentText.trim() || postingComment) return;
    setPostingComment(true);
    try {
      const comment = await addReportComment(report.id, commentText.trim());
      setComments((prev) => [...prev, comment]);
      setCommentText("");
      showToast("Comment posted.");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Unable to post comment.", "error");
    } finally {
      setPostingComment(false);
    }
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.date.trim() || savingEdit) return;
    setSavingEdit(true);
    try {
      await updateDailyReport(report.id, form);
      showToast("Daily report updated.");
      setEditing(false);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Unable to update report.", "error");
    } finally {
      setSavingEdit(false);
    }
  }

  return (
    <Modal
      title={editing ? "Edit Daily Report" : "Daily Report Details"}
      onClose={onClose}
      wide
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col gap-3 border-b border-border pb-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#0B1120] text-sm font-bold text-blue-300">
              {employee?.initials ?? "?"}
            </div>
            <div>
              {employee ? (
                <Link
                  href={`/employees/${employee.id}`}
                  className="font-semibold text-ink hover:text-brand-600 hover:underline"
                >
                  {employee.name}
                </Link>
              ) : (
                <p className="font-semibold text-ink">Former Employee</p>
              )}
              {employee && employee.departments.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {employee.departments.map((dept) => (
                    <DepartmentBadge key={dept} name={dept} />
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-sm font-semibold text-ink">📅 {formatDate(report.date)}</p>
            <p className="text-[11px] text-ink-faint">Submitted {formatDateTime(report.submittedAt)}</p>
          </div>
        </div>

        {editing ? (
          <form onSubmit={handleSaveEdit} className="space-y-3">
            <Field label="Date">
              <input
                type="date"
                className="input"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
              />
            </Field>
            <Field label="What I worked on">
              <textarea
                className="input min-h-[70px] resize-none"
                value={form.workedOn}
                onChange={(e) => setForm({ ...form, workedOn: e.target.value })}
                required
              />
            </Field>
            <Field label="What I completed">
              <textarea
                className="input min-h-[60px] resize-none"
                value={form.completed}
                onChange={(e) => setForm({ ...form, completed: e.target.value })}
              />
            </Field>
            <Field label="What remains / next steps">
              <textarea
                className="input min-h-[60px] resize-none"
                value={form.remaining}
                onChange={(e) => setForm({ ...form, remaining: e.target.value })}
              />
            </Field>
            <Field label="Blockers">
              <textarea
                className="input min-h-[60px] resize-none"
                value={form.blockers}
                onChange={(e) => setForm({ ...form, blockers: e.target.value })}
              />
            </Field>
            <div className="flex justify-end gap-2 pt-1">
              <SecondaryButton type="button" onClick={() => setEditing(false)} disabled={savingEdit}>
                Cancel
              </SecondaryButton>
              <PrimaryButton type="submit" loading={savingEdit} loadingText="Saving changes...">
                Save Changes
              </PrimaryButton>
            </div>
          </form>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs">
              <ReportSection title="🔨 What I Worked On" content={report.workedOn} />
              <ReportSection title="✅ What I Completed" content={report.completed} accent="emerald" />
              <ReportSection title="⏳ What Remains" content={report.remaining} accent="blue" />
              <ReportSection
                title="🚫 Blockers"
                content={report.blockers || "No blockers reported."}
                accent={report.blockers ? "rose" : "default"}
              />
            </div>

            {canEdit && (
              <div className="flex justify-end">
                <SecondaryButton type="button" onClick={() => setEditing(true)}>
                  ✏️ Edit Report
                </SecondaryButton>
              </div>
            )}
          </>
        )}

        {/* Comments */}
        <div className="rounded-lg border border-border bg-canvas/40 p-3 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Comments ({comments.length})
          </p>

          {loadingComments ? (
            <p className="text-xs text-ink-faint">Loading comments...</p>
          ) : comments.length === 0 ? (
            <p className="text-xs text-ink-faint italic">No comments yet. Be the first to leave feedback.</p>
          ) : (
            <ul className="space-y-2 max-h-48 overflow-y-auto">
              {comments.map((comment) => {
                const author = employees.find((e) => e.id === comment.employeeId);
                return (
                  <li key={comment.id} className="rounded-md border border-border bg-panel p-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-ink">{author?.name ?? "Unknown"}</span>
                      <span className="text-[10px] text-ink-faint">{formatDateTime(comment.createdAt)}</span>
                    </div>
                    <p className="mt-1 text-xs text-ink whitespace-pre-wrap">{comment.body}</p>
                  </li>
                );
              })}
            </ul>
          )}

          <form onSubmit={handlePostComment} className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="flex-1">
              <textarea
                className="input min-h-[60px] resize-none text-xs"
                placeholder="Leave a comment or feedback..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              />
            </div>
            <PrimaryButton
              type="submit"
              loading={postingComment}
              loadingText="Posting..."
              className="w-full sm:w-auto flex-shrink-0"
            >
              Post Comment
            </PrimaryButton>
          </form>
        </div>
      </div>
    </Modal>
  );
}

function ReportSection({
  title,
  content,
  accent = "default",
}: {
  title: string;
  content: string;
  accent?: "default" | "emerald" | "blue" | "rose";
}) {
  const styles = {
    default: "border-border/70 bg-canvas/40",
    emerald: "border-emerald-100 bg-emerald-50/30",
    blue: "border-blue-100 bg-blue-50/30",
    rose: "border-rose-200 bg-rose-50/40",
  };

  return (
    <div className={`rounded-md border p-3 space-y-1 ${styles[accent]}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">{title}</p>
      <p className="text-xs text-ink whitespace-pre-wrap leading-relaxed">
        {content || <span className="text-ink-faint italic">None specified</span>}
      </p>
    </div>
  );
}
