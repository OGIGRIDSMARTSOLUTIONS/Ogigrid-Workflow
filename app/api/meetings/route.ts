import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/guard";
import { isUuid } from "@/lib/server/ids";
import { createMeeting } from "@/lib/server/repo";

export async function POST(request: Request) {
  const { user, error } = await requireAdmin();
  if (error) return error;

  const body = await request.json().catch(() => null);
  if (!body || !body.title || typeof body.title !== "string" || !body.title.trim()) {
    return NextResponse.json({ error: "Meeting title is required." }, { status: 400 });
  }

  if (!body.date) {
    return NextResponse.json({ error: "Meeting date is required." }, { status: 400 });
  }

  if (body.projectId && !isUuid(body.projectId)) {
    return NextResponse.json({ error: "Invalid project ID." }, { status: 400 });
  }
  if (Array.isArray(body.attendeeIds) && body.attendeeIds.some((id: unknown) => !isUuid(id))) {
    return NextResponse.json({ error: "Invalid attendee ID." }, { status: 400 });
  }

  const meeting = await createMeeting(
    {
      title: body.title.trim(),
      date: body.date,
      time: body.time ?? "09:00",
      platform: body.platform ?? "Google Meet",
      meetingLink: body.meetingLink || undefined,
      attendeeIds: Array.isArray(body.attendeeIds) ? body.attendeeIds : [],
      projectId: body.projectId || null,
      details: body.details ?? "",
    },
    user!.id
  );
  return NextResponse.json({ meeting });
}
