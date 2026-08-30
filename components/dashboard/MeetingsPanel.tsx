import Link from "next/link";
import { Panel } from "@/components/ui/Panel";
import { formatDate, isMeetingEnded } from "@/lib/data";
import { Employee, Meeting, Project } from "@/lib/types";

export function MeetingsPanel({
  meetings,
  projects,
  employees = [],
}: {
  meetings: Meeting[];
  projects: Project[];
  employees?: Employee[];
}) {
  return (
    <Panel
      title="Team Meetings"
      action={
        <Link href="/meetings" className="text-xs font-medium text-brand-600 hover:underline">
          View all →
        </Link>
      }
    >
      {meetings.length === 0 ? (
        <p className="text-sm text-ink-faint">
          No meetings scheduled.{" "}
          <Link href="/meetings" className="text-brand-600 hover:underline">
            Add a meeting.
          </Link>
        </p>
      ) : (
        <ul className="space-y-3.5">
          {meetings.map((meeting) => {
            const project = projects.find((p) => p.id === meeting.projectId);
            const attendees = employees.filter((e) => meeting.attendeeIds.includes(e.id));
            const ended = isMeetingEnded(meeting.date, meeting.time);

            return (
              <li key={meeting.id} className="border-b border-border/60 pb-3 last:border-0 last:pb-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-sm font-medium text-ink truncate">{meeting.title}</p>
                      {ended ? (
                        <span className="rounded bg-gray-100 px-1.5 py-0.2 text-[10px] font-semibold text-gray-600 border border-gray-200">
                          Ended
                        </span>
                      ) : (
                        <span className="rounded bg-emerald-50 px-1.5 py-0.2 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                          Scheduled
                        </span>
                      )}
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-ink-muted">
                      <span className="inline-flex items-center gap-1 rounded bg-purple-50 px-1.5 py-0.5 text-[11px] font-medium text-purple-700">
                        📹 {meeting.platform || "Google Meet"}
                      </span>
                      <span className="text-ink-faint">
                        {project ? `Project: ${project.name}` : "General Meeting"}
                      </span>
                    </div>

                    {attendees.length > 0 && (
                      <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] text-ink-faint">Attendees:</span>
                        <div className="flex items-center -space-x-1 overflow-hidden">
                          {attendees.slice(0, 4).map((a) => (
                            <span
                              key={a.id}
                              title={a.name}
                              className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#0B1120] text-[9px] font-bold text-blue-300 ring-2 ring-panel"
                            >
                              {a.initials}
                            </span>
                          ))}
                        </div>
                        <span className="text-[11px] text-ink-muted truncate max-w-[180px]">
                          {attendees.map((a) => a.name).join(", ")}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-semibold text-ink">{meeting.time}</p>
                    <p className="text-[11px] text-ink-faint">{formatDate(meeting.date)}</p>
                    {meeting.meetingLink && !ended && (
                      <a
                        href={
                          meeting.meetingLink.startsWith("http")
                            ? meeting.meetingLink
                            : `https://${meeting.meetingLink}`
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
                      >
                        Join ↗
                      </a>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
