interface Metric {
  label: string;
  value: number;
}

export function MetricsRow({ metrics }: { metrics: Metric[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {metrics.map((metric) => (
        <div
          key={metric.label}
          className="rounded-md border border-border bg-panel p-4 shadow-subtle"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">
            {metric.label}
          </p>
          <p className="mt-2 text-2xl font-semibold text-ink">{metric.value}</p>
        </div>
      ))}
    </div>
  );
}
