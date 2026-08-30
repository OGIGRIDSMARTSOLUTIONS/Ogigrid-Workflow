"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { isAfter6pm, todayIso } from "@/lib/data";
import { SearchBar } from "./SearchBar";
import { NotificationsPanel } from "./NotificationsPanel";
import { UserMenu } from "./UserMenu";

interface TopbarProps {
  title: string;
  subtitle?: string;
}

export function Topbar({ title, subtitle }: TopbarProps) {
  const { notifications, dailyReports } = useApp();
  const { currentUser } = useAuth();
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

  const today = todayIso();
  const after6pm = isAfter6pm();
  const hasSubmittedToday = currentUser
    ? dailyReports.some((r) => r.employeeId === currentUser.id && r.date === today)
    : true;
  const needsStandupReminder = after6pm && !hasSubmittedToday;

  const dbUnreadCount = currentUser
    ? notifications.filter((n) => n.userId === currentUser.id && !n.read).length
    : 0;

  const totalUnreadCount = dbUnreadCount + (needsStandupReminder ? 1 : 0);

  return (
    <header className="flex items-center justify-between border-b border-border bg-panel px-6 py-4">
      <div>
        <h1 className="text-lg font-semibold text-ink">{title}</h1>
        {subtitle && <p className="text-sm text-ink-muted">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        <SearchBar />

        <div className="relative">
          <button
            onClick={() => {
              setNotifOpen((v) => !v);
              setUserOpen(false);
            }}
            aria-label="Notifications"
            className="relative flex h-8 w-8 items-center justify-center rounded-sm border border-border bg-panel text-ink-muted hover:bg-canvas"
          >
            🔔
            {totalUnreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-status-notsubmitted px-1 text-[10px] font-semibold text-white">
                {totalUnreadCount > 9 ? "9+" : totalUnreadCount}
              </span>
            )}
          </button>
          {notifOpen && <NotificationsPanel onClose={() => setNotifOpen(false)} />}
        </div>

        <div className="relative">
          <button
            onClick={() => {
              setUserOpen((v) => !v);
              setNotifOpen(false);
            }}
            className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-tr from-blue-600 to-indigo-600 text-xs font-bold text-white shadow-sm ring-2 ring-white"
          >
            {currentUser?.initials ?? "?"}
          </button>
          {userOpen && <UserMenu onClose={() => setUserOpen(false)} />}
        </div>
      </div>
    </header>
  );
}
