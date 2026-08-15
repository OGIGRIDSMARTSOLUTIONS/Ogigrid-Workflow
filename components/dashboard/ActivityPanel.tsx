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
            <li key={item.id} className="flex gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand-500" />
              <div>
                <p className="text-sm text-ink">{item.description}</p>
                <p className="text-xs text-ink-faint">{formatDateTime(item.timestamp)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
