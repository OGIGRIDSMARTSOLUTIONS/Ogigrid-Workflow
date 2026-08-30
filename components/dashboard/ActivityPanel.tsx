import { Panel } from "@/components/ui/Panel";
import { formatDateTime } from "@/lib/data";
import { ActivityItem } from "@/lib/types";

export function ActivityPanel({ activity }: { activity: ActivityItem[] }) {
  return (
    <Panel title="Recent Activity">
      {activity.length === 0 ? (
        <p className="text-sm text-ink-faint">
          No activity yet. Actions like creating a project, assigning a task, or submitting a
          daily report will show up here.
        </p>
      ) : (
        <ul className="space-y-3">
          {activity.map((item) => (
            <li key={item.id} className="flex gap-2.5 border-b border-border/50 pb-2.5 last:border-0 last:pb-0">
              <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-blue-600 ring-2 ring-blue-100" />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-ink">{item.description}</p>
                <p className="text-[11px] text-ink-faint mt-0.5">{formatDateTime(item.timestamp)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
