import Link from "next/link";
import { Panel } from "@/components/ui/Panel";
import { formatDate } from "@/lib/data";
import { Meeting, Project } from "@/lib/types";

export function MeetingsPanel({ meetings, projects }: { meetings: Meeting[]; projects: Project[] }) {
  return (
    <Panel title="Upcoming Meetings">
      {meetings.length === 0 ? (
        <p className="text-sm text-ink-faint">
          No meetings scheduled.{" "}
          <Link href="/meetings" className="text-brand-600 hover:underline">
            Add a meeting.
          </Link>
        </p>
      ) : (
        <ul className="space-y-3">
          {meetings.map((meeting) => {
            const project = projects.find((p) => p.id === meeting.projectId);
            return (
              <li key={meeting.id} className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-ink">{meeting.title}</p>
                  <p className="text-xs text-ink-faint">{project?.name ?? "No project"}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-ink-muted">{meeting.time}</p>
                  <p className="text-xs text-ink-faint">{formatDate(meeting.date)}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
