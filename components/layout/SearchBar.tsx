"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/store";
import { useAuth } from "@/lib/auth";

interface SearchResult {
  id: string;
  type: string;
  label: string;
  sublabel: string;
  href: string;
}

export function SearchBar() {
  const { employees, projects, tasks, dailyReports, meetings, documents } = useApp();
  const { currentUser } = useAuth();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const isAdmin = currentUser?.role === "Admin";

  const results = useMemo<SearchResult[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q || !currentUser) return [];

    const visibleProjects = isAdmin
      ? projects
      : projects.filter((p) => p.memberIds.includes(currentUser.id));
    const visibleTasks = isAdmin ? tasks : tasks.filter((t) => t.assigneeId === currentUser.id);
    const visibleReports = isAdmin
      ? dailyReports
      : dailyReports.filter((r) => r.employeeId === currentUser.id);

    const out: SearchResult[] = [];

    employees
      .filter((e) => e.name.toLowerCase().includes(q) || e.email.toLowerCase().includes(q))
      .forEach((e) =>
        out.push({ id: e.id, type: "Employee", label: e.name, sublabel: e.role, href: `/employees/${e.id}` })
      );

    visibleProjects
      .filter((p) => p.name.toLowerCase().includes(q))
      .forEach((p) =>
        out.push({ id: p.id, type: "Project", label: p.name, sublabel: p.status, href: `/projects/${p.id}` })
      );

    visibleTasks
      .filter((t) => t.name.toLowerCase().includes(q))
      .forEach((t) =>
        out.push({ id: t.id, type: "Task", label: t.name, sublabel: t.status, href: `/tasks/${t.id}` })
      );

    meetings
      .filter((m) => m.title.toLowerCase().includes(q))
      .forEach((m) =>
        out.push({ id: m.id, type: "Meeting", label: m.title, sublabel: m.date, href: `/meetings` })
      );

    documents
      .filter((d) => d.name.toLowerCase().includes(q))
      .forEach((d) =>
        out.push({ id: d.id, type: "Document", label: d.name, sublabel: "Document", href: `/documents` })
      );

    visibleReports
      .filter((r) => r.workedOn.toLowerCase().includes(q) || r.completed.toLowerCase().includes(q))
      .forEach((r) =>
        out.push({
          id: r.id,
          type: "Daily Report",
          label: `Report — ${r.date}`,
          sublabel: r.workedOn.slice(0, 40) || "Daily report",
          href: `/daily-reports`,
        })
      );

    return out.slice(0, 8);
  }, [query, currentUser, isAdmin, employees, projects, tasks, meetings, documents, dailyReports]);

  function handleSelect(result: SearchResult) {
    setQuery("");
    setOpen(false);
    router.push(result.href);
  }

  return (
    <div className="relative" ref={containerRef}>
      <input
        type="text"
        placeholder="Search..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="w-28 sm:w-48 md:w-56 rounded-md border border-border bg-canvas px-2.5 py-1.5 text-xs sm:text-sm text-ink placeholder:text-ink-faint focus:border-brand-400 focus:outline-none transition-all"
      />
      {open && query.trim() && (
        <div className="absolute right-0 z-40 mt-1 w-[calc(100vw-3rem)] sm:w-80 max-w-sm rounded-md border border-border bg-panel shadow-panel">
          {results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-ink-faint">No results found.</p>
          ) : (
            <ul className="max-h-80 overflow-y-auto py-1">
              {results.map((result) => (
                <li key={`${result.type}-${result.id}`}>
                  <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelect(result)}
                    className="flex w-full items-center justify-between px-4 py-2 text-left text-sm hover:bg-canvas"
                  >
                    <span>
                      <span className="font-medium text-ink">{result.label}</span>
                      <span className="ml-2 text-xs text-ink-faint">{result.sublabel}</span>
                    </span>
                    <span className="text-[10px] uppercase tracking-wide text-ink-faint">
                      {result.type}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
