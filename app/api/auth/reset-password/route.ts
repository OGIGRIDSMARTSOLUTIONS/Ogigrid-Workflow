import { NextResponse } from "next/server";
import { consumePasswordResetToken } from "@/lib/server/repo";
import { validatePassword } from "@/lib/passwordValidation";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const token = body?.token;
  const newPassword = body?.newPassword;

  if (!token || typeof token !== "string") {
    return NextResponse.json({ error: "Missing or invalid reset token." }, { status: 400 });
  }
  const passwordCheck = validatePassword(newPassword);
  if (!passwordCheck.valid) {
    return NextResponse.json({ error: passwordCheck.error }, { status: 400 });
  }

  const result = await consumePasswordResetToken(token, newPassword);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
