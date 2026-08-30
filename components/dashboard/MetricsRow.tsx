interface Metric {
  label: string;
  value: number;
}

const metricAccents: Record<string, { border: string; bg: string; text: string; icon: string }> = {
  "Active Team Members": {
    border: "border-t-2 border-t-blue-500",
    bg: "bg-blue-50",
    text: "text-blue-700",
    icon: "👥",
  },
  "Active Tasks": {
    border: "border-t-2 border-t-indigo-500",
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    icon: "⚡",
  },
  "Blocked / In Review": {
    border: "border-t-2 border-t-amber-500",
    bg: "bg-amber-50",
    text: "text-amber-700",
    icon: "⚠️",
  },
  "Active Projects": {
    border: "border-t-2 border-t-emerald-500",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    icon: "📁",
  },
};

export function MetricsRow({ metrics }: { metrics: Metric[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {metrics.map((metric) => {
        const accent = metricAccents[metric.label] || {
          border: "border-t-2 border-t-brand-500",
          bg: "bg-brand-50",
          text: "text-brand-700",
          icon: "📊",
        };

        return (
          <div
            key={metric.label}
            className={`rounded-md border border-border bg-panel p-4 shadow-subtle ${accent.border} transition-all hover:shadow-panel`}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">
                {metric.label}
              </p>
              <span className={`inline-flex h-6 w-6 items-center justify-center rounded text-xs ${accent.bg}`}>
                {accent.icon}
              </span>
            </div>
            <p className="mt-2 text-2xl font-semibold text-ink">{metric.value}</p>
          </div>
        );
      })}
    </div>
  );
}
