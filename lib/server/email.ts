// Thin wrapper around the Resend HTTP API. Uses plain fetch rather than the
// `resend` npm package so this doesn't add a new dependency for one call.
//
// Required env vars:
//   RESEND_API_KEY     — from your Resend dashboard
//   RESEND_FROM_EMAIL  — optional, e.g. "Ogigrid Workflow <no-reply@yourdomain.com>".
//                         Falls back to Resend's shared sandbox sender, which
//                         only delivers to the email address on your Resend
//                         account until you verify your own sending domain.
const RESEND_API_URL = "https://api.resend.com/emails";

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || "Ogigrid Workflow <onboarding@resend.dev>";

  if (!apiKey) {
    // Fail loudly in server logs, but never leak "email sending is
    // misconfigured" to the client — the forgot-password route always
    // returns the same generic message either way.
    console.error("RESEND_API_KEY is not set; password reset email was not sent.");
    return;
  }

  const res = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject: "Reset your Ogigrid Workflow password",
      html: `
        <p>We received a request to reset your Ogigrid Workflow password.</p>
        <p><a href="${resetUrl}">Click here to choose a new password</a>.
           This link expires in 1 hour.</p>
        <p>If you didn't request this, you can safely ignore this email —
           your password will not change.</p>
      `,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("Resend API error:", res.status, text);
  }
}
