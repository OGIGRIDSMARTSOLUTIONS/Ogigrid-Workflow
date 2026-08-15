"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

interface NavItem {
  label: string;
  href: string;
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Projects", href: "/projects" },
  { label: "Tasks", href: "/tasks" },
  { label: "Schedule", href: "/schedule" },
  { label: "Documents", href: "/documents" },
  { label: "Meetings", href: "/meetings" },
  { label: "Daily Reports", href: "/daily-reports" },
  { label: "Employees", href: "/employees" },
  { label: "Settings", href: "/settings" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-60 flex-shrink-0 flex-col border-r border-border bg-panel">
      <div className="flex items-center gap-2 border-b border-border px-5 py-5">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-sm">
          <Image src="/ogigrid-logo.jpg" alt="Ogigrid" width={32} height={32} className="h-full w-full object-cover" />
        </div>
        <div>
          <p className="text-sm font-semibold text-ink">OGIGRID</p>
          <p className="text-xs text-ink-faint">Workflow</p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 py-4">
        {navItems.map((item) => {
          const isActive = pathname?.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center rounded-sm px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-brand-50 text-brand-700"
                  : "text-ink-muted hover:bg-canvas hover:text-ink"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border px-5 py-4">
        <p className="text-xs text-ink-faint">Ogigrid Workflow · MVP</p>
      </div>
    </aside>
  );
}
