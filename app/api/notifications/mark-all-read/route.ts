import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/server/guard";
import { markAllNotificationsRead } from "@/lib/server/repo";

export async function POST() {
  const { user, error } = await requireAuth();
  if (error) return error;
  await markAllNotificationsRead(user!.id);
  return NextResponse.json({ ok: true });
}
