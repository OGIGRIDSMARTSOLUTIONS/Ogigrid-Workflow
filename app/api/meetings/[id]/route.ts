import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/guard";
import { deleteMeeting, updateMeeting } from "@/lib/server/repo";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { user, error } = await requireAdmin();
  if (error) return error;

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request body." }, { status: 400 });

  const meeting = await updateMeeting(
    params.id,
    {
      title: body.title,
      date: body.date,
      time: body.time,
      platform: body.platform,
      meetingLink: body.meetingLink,
      attendeeIds: body.attendeeIds,
      projectId: body.projectId !== undefined ? body.projectId || null : undefined,
      details: body.details,
    },
    user!.id
  );
  if (!meeting) return NextResponse.json({ error: "Meeting not found." }, { status: 404 });
  return NextResponse.json({ meeting });
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { user, error } = await requireAdmin();
  if (error) return error;
  await deleteMeeting(params.id, user!.id);
  return NextResponse.json({ ok: true });
}
