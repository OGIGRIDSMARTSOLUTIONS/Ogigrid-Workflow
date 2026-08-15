import { ReactNode } from "react";

interface PanelProps {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
}

export function Panel({ title, action, children, className = "", noPadding = false }: PanelProps) {
  return (
    <section
      className={`rounded-md border border-border bg-panel shadow-subtle ${className}`}
    >
      {title && (
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-ink">{title}</h2>
          {action}
        </div>
      )}
      <div className={noPadding ? "" : "p-4"}>{children}</div>
    </section>
  );
}
