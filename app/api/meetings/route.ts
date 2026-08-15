import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/guard";
import { createMeeting } from "@/lib/server/repo";

export async function POST(request: Request) {
  const { user, error } = await requireAdmin();
  if (error) return error;

  const body = await request.json().catch(() => null);
  if (!body || !body.title) {
    return NextResponse.json({ error: "Meeting title is required." }, { status: 400 });
  }

  const meeting = await createMeeting(
    {
      title: body.title,
      date: body.date,
      time: body.time ?? "09:00",
      attendeeIds: Array.isArray(body.attendeeIds) ? body.attendeeIds : [],
      projectId: body.projectId || null,
      details: body.details ?? "",
    },
    user!.id
  );
  return NextResponse.json({ meeting });
}
