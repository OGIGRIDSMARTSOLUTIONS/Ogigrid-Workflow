"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export function UserMenu({ onClose }: { onClose: () => void }) {
  const { currentUser, logout } = useAuth();
  const router = useRouter();

  if (!currentUser) return null;

  async function handleLogout() {
    await logout();
    onClose();
    router.replace("/login");
  }

  return (
    <div className="absolute right-0 top-11 z-40 w-64 rounded-md border border-border bg-panel shadow-panel">
      <div className="border-b border-border px-4 py-3">
        <p className="text-sm font-semibold text-ink">
          {currentUser.name}
          {currentUser.isPrimaryAdmin && (
            <span className="ml-1.5 rounded-sm bg-brand-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-700">
              Primary
            </span>
          )}
        </p>
        <p className="text-xs text-ink-faint">
          {currentUser.role} {currentUser.departments.length > 0 && `· ${currentUser.departments.join(", ")}`}
        </p>
        {currentUser.email && <p className="mt-1 text-xs text-ink-faint">{currentUser.email}</p>}
      </div>
      <nav className="py-1">
        <Link
          href={`/employees/${currentUser.id}`}
          onClick={onClose}
          className="block px-4 py-2 text-sm text-ink-muted hover:bg-canvas hover:text-ink"
        >
          View Profile
        </Link>
        <Link
          href="/settings"
          onClick={onClose}
          className="block px-4 py-2 text-sm text-ink-muted hover:bg-canvas hover:text-ink"
        >
          Settings
        </Link>
        <button
          onClick={handleLogout}
          className="block w-full px-4 py-2 text-left text-sm text-status-notsubmitted hover:bg-canvas"
        >
          Log out
        </button>
      </nav>
    </div>
  );
}
