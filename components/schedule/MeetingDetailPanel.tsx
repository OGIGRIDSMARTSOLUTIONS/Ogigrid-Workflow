"use client";

import Link from "next/link";
import { Panel } from "@/components/ui/Panel";
import { useApp } from "@/lib/store";
import { formatDate } from "@/lib/data";
import { Meeting } from "@/lib/types";

interface MeetingDetailPanelProps {
  meeting: Meeting | null;
  onClose: () => void;
}

export function MeetingDetailPanel({ meeting, onClose }: MeetingDetailPanelProps) {
  const { employees, projects } = useApp();

  if (!meeting) return null;

  const project = projects.find((p) => p.id === meeting.projectId);
  const attendees = employees.filter((e) => meeting.attendeeIds.includes(e.id));

  return (
    <Panel
      title="Meeting Details"
      action={
        <button onClick={onClose} className="text-xs font-medium text-ink-faint hover:text-ink">
          Close
        </button>
      }
      className="h-fit"
    >
      <div className="space-y-4">
        <div>
          <span className="inline-flex items-center gap-1 rounded bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-700">
            📅 Scheduled Meeting
          </span>
          <h3 className="mt-2 text-base font-semibold text-ink">{meeting.title}</h3>
        </div>

        <div className="grid grid-cols-2 gap-3 border-t border-b border-border py-3 text-xs">
          <div>
            <span className="block text-ink-faint uppercase font-medium">Date & Time</span>
            <span className="font-medium text-ink">{formatDate(meeting.date)} · {meeting.time}</span>
          </div>
          <div>
            <span className="block text-ink-faint uppercase font-medium">Platform</span>
            <span className="font-medium text-purple-700">📹 {meeting.platform || "Google Meet"}</span>
          </div>
        </div>

        {meeting.meetingLink && (
          <div>
            <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink-faint">
              Meeting Link
            </span>
            <a
              href={meeting.meetingLink.startsWith("http") ? meeting.meetingLink : `https://${meeting.meetingLink}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-medium text-brand-600 hover:underline break-all"
            >
              {meeting.meetingLink} ↗
            </a>
          </div>
        )}

        <div>
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink-faint">
            Project
          </span>
          <p className="text-sm text-ink">{project ? project.name : "General / No project"}</p>
        </div>

        <div>
          <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-faint">
            Attendees ({attendees.length})
          </span>
          <div className="flex flex-wrap gap-1.5">
            {attendees.map((a) => (
              <span
                key={a.id}
                className="inline-flex items-center gap-1.5 rounded bg-canvas border border-border px-2 py-1 text-xs text-ink"
              >
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand-100 text-[9px] font-semibold text-brand-700">
                  {a.initials}
                </span>
                {a.name}
              </span>
            ))}
            {attendees.length === 0 && (
              <p className="text-xs text-ink-faint">No attendees listed.</p>
            )}
          </div>
        </div>

        {meeting.details && (
          <div>
            <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink-faint">
              Agenda / Notes
            </span>
            <p className="text-sm text-ink-muted whitespace-pre-wrap">{meeting.details}</p>
          </div>
        )}

        <div className="pt-2">
          <Link
            href="/meetings"
            className="text-xs font-medium text-brand-600 hover:underline inline-flex items-center gap-1"
          >
            Manage in Meetings page →
          </Link>
        </div>
      </div>
    </Panel>
  );
}
