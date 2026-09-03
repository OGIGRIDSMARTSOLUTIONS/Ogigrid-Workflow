import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/server/guard";
import { invalidUuidResponse } from "@/lib/server/ids";
import { markNotificationRead } from "@/lib/server/repo";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const badId = invalidUuidResponse(params.id, "notification ID");
  if (badId) return badId;

  await markNotificationRead(params.id, user!.id);
  return NextResponse.json({ ok: true });
}
