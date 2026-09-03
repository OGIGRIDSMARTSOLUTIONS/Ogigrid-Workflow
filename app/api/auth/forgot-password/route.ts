import { NextResponse } from "next/server";
import { findEmployeeByEmail, createPasswordResetToken } from "@/lib/server/repo";
import { sendPasswordResetEmail } from "@/lib/server/email";
import { isRateLimited, getClientIp } from "@/lib/server/rateLimit";
import { validateEmail } from "@/lib/emailValidation";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (isRateLimited(`forgot-password:${ip}`, 5, 15 * 60 * 1000)) {
    // Still return the generic response — don't reveal that a rate limit
    // exists, and don't let this endpoint become an email-existence oracle.
    return NextResponse.json({
      message: "If an account exists for that email, a reset link has been sent.",
    });
  }

  const body = await request.json().catch(() => null);
  const email = (body?.email ?? "").trim().toLowerCase();

  // Always return the same generic response whether or not the email
  // belongs to a real account — this endpoint must not be usable to
  // discover who has an Ogigrid account.
  const genericResponse = NextResponse.json({
    message: "If an account exists for that email, a reset link has been sent.",
  });

  if (!email) return genericResponse;

  // Skip send for invalid/typo emails, but keep the generic response so this
  // endpoint cannot be used to probe which addresses have accounts.
  const emailCheck = validateEmail(email);
  if (!emailCheck.valid) return genericResponse;

  const employee = await findEmployeeByEmail(email);
  if (!employee || employee.status === "Inactive") return genericResponse;

  const rawToken = await createPasswordResetToken(employee.id);
  const origin = new URL(request.url).origin;
  const resetUrl = `${origin}/reset-password?token=${rawToken}`;
  await sendPasswordResetEmail(employee.email, resetUrl);

  return genericResponse;
}
