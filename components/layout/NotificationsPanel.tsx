"use client";

import { useState } from "react";
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
      return `/employees`;
    default:
      return null;
  }
}

export function NotificationsPanel({ onClose }: { onClose: () => void }) {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useApp();
  const { currentUser } = useAuth();
  const router = useRouter();

  if (!currentUser) return null;

  const mine = notifications
    .filter((n) => n.userId === currentUser.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  function handleClick(notif: (typeof mine)[number]) {
    markNotificationRead(notif.id);
    const href = relatedHref(notif.relatedType, notif.relatedId);
    if (href) {
      router.push(href);
      onClose();
    }
  }

  return (
    <div className="absolute right-0 top-11 z-40 w-96 rounded-md border border-border bg-panel shadow-panel">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold text-ink">Notifications</h3>
        {mine.some((n) => !n.read) && (
          <button
            onClick={() => markAllNotificationsRead()}
            className="text-xs font-medium text-brand-600 hover:underline"
          >
            Mark all as read
          </button>
        )}
      </div>
      <div className="max-h-96 overflow-y-auto">
        {mine.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-ink-faint">You're all caught up.</p>
        ) : (
          <ul className="divide-y divide-border">
            {mine.map((notif) => (
              <li key={notif.id}>
                <button
                  onClick={() => handleClick(notif)}
                  className={`flex w-full flex-col items-start gap-0.5 px-4 py-3 text-left transition-colors hover:bg-canvas ${
                    notif.read ? "" : "bg-brand-50/40"
                  }`}
                >
                  <div className="flex w-full items-center justify-between">
                    <span className="text-sm font-medium text-ink">{notif.title}</span>
                    {!notif.read && <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand-500" />}
                  </div>
                  <span className="text-xs text-ink-muted">{notif.message}</span>
                  <span className="text-[11px] text-ink-faint">{formatDateTime(notif.createdAt)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
