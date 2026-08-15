import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/server/guard";
import { markNotificationRead } from "@/lib/server/repo";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { user, error } = await requireAuth();
  if (error) return error;
  await markNotificationRead(params.id, user!.id);
  return NextResponse.json({ ok: true });
}
