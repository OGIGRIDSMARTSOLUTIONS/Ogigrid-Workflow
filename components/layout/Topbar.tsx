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
  onOpenMenu?: () => void;
}

export function Topbar({ title, subtitle, onOpenMenu }: TopbarProps) {
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
    <header className="flex items-center justify-between border-b border-border bg-panel px-4 py-3 sm:px-6 sm:py-4 gap-2 sm:gap-4">
      <div className="flex items-center gap-3 min-w-0">
        {onOpenMenu && (
          <button
            type="button"
            onClick={onOpenMenu}
            aria-label="Open sidebar menu"
            className="flex h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0 items-center justify-center rounded-md border border-border bg-canvas text-ink hover:bg-slate-100 lg:hidden"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
        <div className="min-w-0">
          <h1 className="text-base sm:text-lg font-bold text-ink truncate">{title}</h1>
          {subtitle && <p className="hidden sm:block text-xs text-ink-muted truncate">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        <SearchBar />

        <div className="relative">
          <button
            onClick={() => {
              setNotifOpen((v) => !v);
              setUserOpen(false);
            }}
            aria-label="Notifications"
            className="relative flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-md border border-border bg-panel text-ink-muted hover:bg-canvas"
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
            className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-md bg-gradient-to-tr from-blue-600 to-indigo-600 text-xs font-bold text-white shadow-sm ring-2 ring-white"
          >
            {currentUser?.initials ?? "?"}
          </button>
          {userOpen && <UserMenu onClose={() => setUserOpen(false)} />}
        </div>
      </div>
    </header>
  );
}
