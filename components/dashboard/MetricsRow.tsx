import Link from "next/link";

interface Metric {
  label: string;
  value: number;
  href?: string;
}

const metricAccents: Record<string, { topBorder: string; bg: string; text: string; icon: string }> = {
  "Active Team Members": {
    topBorder: "border-t-2 border-t-blue-600",
    bg: "bg-blue-50 text-blue-700",
    text: "text-blue-700",
    icon: "👥",
  },
  "Active Tasks": {
    topBorder: "border-t-2 border-t-indigo-600",
    bg: "bg-indigo-50 text-indigo-700",
    text: "text-indigo-700",
    icon: "⚡",
  },
  "Blocked / In Review": {
    topBorder: "border-t-2 border-t-amber-500",
    bg: "bg-amber-50 text-amber-700",
    text: "text-amber-700",
    icon: "⚠️",
  },
  "Active Projects": {
    topBorder: "border-t-2 border-t-emerald-600",
    bg: "bg-emerald-50 text-emerald-700",
    text: "text-emerald-700",
    icon: "📁",
  },
};

export function MetricsRow({ metrics }: { metrics: Metric[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {metrics.map((metric) => {
        const accent = metricAccents[metric.label] || {
          topBorder: "border-t-2 border-t-blue-600",
          bg: "bg-blue-50 text-blue-700",
          text: "text-blue-700",
          icon: "📊",
        };

        return (
          <Link
            key={metric.label}
            href={metric.href ?? "#"}
            aria-disabled={!metric.href}
            className={`block rounded-lg border border-border bg-panel p-4 shadow-subtle ${accent.topBorder} transition-all hover:border-slate-300 hover:shadow-md ${
              metric.href ? "cursor-pointer" : "pointer-events-none"
            }`}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
                {metric.label}
              </p>
              <span className={`inline-flex h-7 w-7 items-center justify-center rounded-md text-xs font-bold ${accent.bg}`}>
                {accent.icon}
              </span>
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight text-ink">{metric.value}</p>
          </Link>
        );
      })}
    </div>
  );
}
