import { NextResponse } from "next/server";
import { consumePasswordResetToken } from "@/lib/server/repo";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const token = body?.token;
  const newPassword = body?.newPassword;

  if (!token || typeof token !== "string") {
    return NextResponse.json({ error: "Missing or invalid reset token." }, { status: 400 });
  }
  if (!newPassword || typeof newPassword !== "string" || newPassword.length < 6) {
    return NextResponse.json({ error: "New password must be at least 6 characters." }, { status: 400 });
  }

  const result = await consumePasswordResetToken(token, newPassword);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
