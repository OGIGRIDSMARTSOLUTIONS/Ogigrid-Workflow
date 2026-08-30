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
    <aside className="flex h-screen w-64 flex-shrink-0 flex-col bg-[#0B1120] text-slate-300 shadow-xl border-r border-slate-800">
      {/* Brand Header */}
      <div className="flex items-center gap-3 border-b border-slate-800/80 px-6 py-5 bg-[#070D19]">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg shadow-md ring-1 ring-white/10">
          <Image src="/ogigrid-logo.jpg" alt="Ogigrid" width={40} height={40} className="h-full w-full object-cover" />
        </div>
        <div>
          <p className="text-base font-bold tracking-tight text-white">OGIGRID</p>
          <p className="text-xs font-medium text-blue-400">Workflow Suite</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-5">
        {navItems.map((item) => {
          const isActive = pathname?.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-md shadow-blue-500/20"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-100"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-800/80 px-6 py-4 bg-[#070D19]/60">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-slate-400">Ogigrid Workflow</p>
          <span className="inline-flex items-center rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] font-semibold text-blue-300 border border-blue-500/30">
            Active
          </span>
        </div>
      </div>
    </aside>
  );
}
