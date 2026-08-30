"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { formatDateTime } from "@/lib/data";

function relatedHref(relatedType: string | null, relatedId: string | null): string | null {
  if (!relatedType || !relatedId) return null;
  switch (relatedType) {
    case "task":
      return `/tasks/${relatedId}`;
    case "project":
      return `/projects/${relatedId}`;
    case "meeting":
      return `/meetings`;
    case "report":
      return `/daily-reports`;
    case "employee":
      return `/employees/${relatedId}`;
    default:
      return null;
  }
}

function getNotificationIcon(type: string): string {
  switch (type) {
    case "meeting":
      return "📅";
    case "task-assigned":
      return "📌";
    case "task-status":
      return "⚡";
    case "project-membership":
      return "📁";
    case "daily-report":
      return "📝";
    default:
      return "🔔";
  }
}

export function NotificationsPanel({ onClose }: { onClose: () => void }) {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useApp();
  const { currentUser } = useAuth();
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "unread">("all");

  if (!currentUser) return null;

  const mine = useMemo(() => {
    return notifications
      .filter((n) => n.userId === currentUser.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [notifications, currentUser.id]);

  const unreadList = useMemo(() => mine.filter((n) => !n.read), [mine]);
  const displayedList = filter === "unread" ? unreadList : mine;

  function handleClick(notif: (typeof mine)[number]) {
    if (!notif.read) {
      markNotificationRead(notif.id);
    }
    const href = relatedHref(notif.relatedType, notif.relatedId);
    if (href) {
      router.push(href);
      onClose();
    }
  }

  return (
    <div className="absolute right-0 top-11 z-50 w-96 rounded-md border border-border bg-panel shadow-panel animate-in fade-in zoom-in-95 duration-100">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-ink">Notifications</h3>
          {unreadList.length > 0 && (
            <span className="rounded-full bg-brand-100 px-2 py-0.2 text-[11px] font-bold text-brand-700">
              {unreadList.length} new
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {unreadList.length > 0 && (
            <button
              onClick={() => markAllNotificationsRead()}
              className="text-xs font-medium text-brand-600 hover:underline"
            >
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border bg-canvas/40 px-4 py-1.5 text-xs">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`rounded px-2 py-0.5 font-medium transition-colors ${
            filter === "all" ? "bg-panel text-ink shadow-subtle" : "text-ink-muted hover:text-ink"
          }`}
        >
          All ({mine.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter("unread")}
          className={`rounded px-2 py-0.5 font-medium transition-colors ${
            filter === "unread" ? "bg-panel text-ink shadow-subtle" : "text-ink-muted hover:text-ink"
          }`}
        >
          Unread ({unreadList.length})
        </button>
      </div>

      {/* Notification List */}
      <div className="max-h-96 overflow-y-auto">
        {displayedList.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-ink-faint">
            <p className="text-2xl mb-1">🎉</p>
            <p className="font-medium text-ink">
              {filter === "unread" ? "No unread notifications" : "You're all caught up"}
            </p>
            <p className="text-xs text-ink-muted mt-0.5">
              Updates about assigned tasks, meetings, and project invites will appear here.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border/60">
            {displayedList.map((notif) => (
              <li key={notif.id}>
                <button
                  onClick={() => handleClick(notif)}
                  className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-canvas ${
                    notif.read ? "bg-panel" : "bg-brand-50/30"
                  }`}
                >
                  <span className="text-base leading-none mt-0.5">
                    {getNotificationIcon(notif.type)}
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className={`text-xs font-semibold truncate ${notif.read ? "text-ink" : "text-brand-800"}`}>
                        {notif.title}
                      </span>
                      {!notif.read && (
                        <span className="h-2 w-2 flex-shrink-0 rounded-full bg-brand-600" />
                      )}
                    </div>
                    <p className="text-xs text-ink-muted mt-0.5 line-clamp-2">
                      {notif.message}
                    </p>
                    <span className="text-[10px] text-ink-faint mt-1 block">
                      {formatDateTime(notif.createdAt)}
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
