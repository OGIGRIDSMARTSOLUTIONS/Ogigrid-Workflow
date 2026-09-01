import { NextResponse } from "next/server";
import { destroySession } from "@/lib/server/session";

export async function POST() {
  await destroySession();
  const res = NextResponse.json({ ok: true });
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  res.headers.set("Pragma", "no-cache");
  return res;
}
