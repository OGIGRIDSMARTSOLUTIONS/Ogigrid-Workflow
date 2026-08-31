import { NextResponse } from "next/server";
import { findEmployeeByEmail, createPasswordResetToken } from "@/lib/server/repo";
import { sendPasswordResetEmail } from "@/lib/server/email";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = (body?.email ?? "").trim().toLowerCase();

  // Always return the same generic response whether or not the email
  // belongs to a real account — this endpoint must not be usable to
  // discover who has an Ogigrid account.
  const genericResponse = NextResponse.json({
    message: "If an account exists for that email, a reset link has been sent.",
  });

  if (!email) return genericResponse;

  const employee = await findEmployeeByEmail(email);
  if (!employee || employee.status === "Inactive") return genericResponse;

  const rawToken = await createPasswordResetToken(employee.id);
  const origin = new URL(request.url).origin;
  const resetUrl = `${origin}/reset-password?token=${rawToken}`;
  await sendPasswordResetEmail(employee.email, resetUrl);

  return genericResponse;
}
