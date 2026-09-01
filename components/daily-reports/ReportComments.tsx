"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/ui/Toast";
import { formatDateTime } from "@/lib/data";
import { ReportComment } from "@/lib/types";

export function ReportComments({ reportId, comments }: { reportId: string; comments: ReportComment[] }) {
  const { employees, addReportComment, deleteReportComment } = useApp();
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!currentUser) return null;
  const isAdmin = currentUser.role === "Admin";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || submitting) return;
    setSubmitting(true);
    try {
      await addReportComment(reportId, text);
      setDraft("");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Unable to post comment.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(commentId: string) {
    try {
      await deleteReportComment(reportId, commentId);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Unable to delete comment.", "error");
    }
  }

  return (
    <div className="space-y-2 pt-2 border-t border-border/60">
      {comments.length > 0 && (
        <div className="space-y-2">
          {comments.map((comment) => {
            const author = employees.find((e) => e.id === comment.employeeId);
            const canDelete = isAdmin || comment.employeeId === currentUser.id;
            return (
              <div key={comment.id} className="flex items-start justify-between gap-2 text-xs">
                <div className="min-w-0">
                  <span className="font-semibold text-ink">{author?.name ?? "Former Partner"}</span>
                  <span className="text-ink-faint ml-1.5">{formatDateTime(comment.createdAt)}</span>
                  <p className="text-ink-muted mt-0.5 whitespace-pre-wrap break-words">{comment.body}</p>
                </div>
                {canDelete && (
                  <button
                    type="button"
                    onClick={() => handleDelete(comment.id)}
                    className="text-ink-faint hover:text-status-notsubmitted flex-shrink-0"
                    aria-label="Delete comment"
                  >
                    ✕
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add a comment…"
          className="input flex-1 text-xs"
        />
        <button
          type="submit"
          disabled={!draft.trim() || submitting}
          className="rounded-md bg-[#0B1120] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40 flex-shrink-0"
        >
          Post
        </button>
      </form>
    </div>
  );
}
