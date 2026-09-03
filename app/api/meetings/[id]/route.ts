import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/guard";
import { invalidUuidResponse, isUuid } from "@/lib/server/ids";
import { deleteMeeting, updateMeeting } from "@/lib/server/repo";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { user, error } = await requireAdmin();
  if (error) return error;

  const badId = invalidUuidResponse(params.id, "meeting ID");
  if (badId) return badId;

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request body." }, { status: 400 });

  if (body.projectId !== undefined && body.projectId !== null && body.projectId !== "" && !isUuid(body.projectId)) {
    return NextResponse.json({ error: "Invalid project ID." }, { status: 400 });
  }
  if (Array.isArray(body.attendeeIds) && body.attendeeIds.some((id: unknown) => !isUuid(id))) {
    return NextResponse.json({ error: "Invalid attendee ID." }, { status: 400 });
  }

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

  const badId = invalidUuidResponse(params.id, "meeting ID");
  if (badId) return badId;

  await deleteMeeting(params.id, user!.id);
  return NextResponse.json({ ok: true });
}
