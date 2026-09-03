"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Field, PrimaryButton, SecondaryButton } from "@/components/ui/FormControls";
import { validateEmail } from "@/lib/emailValidation";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const emailCheck = validateEmail(email);
    if (!emailCheck.valid) {
      setError(emailCheck.error ?? "Please enter a valid email address.");
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Unable to process request.");
      }
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const backgroundPattern =
    `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240' viewBox='0 0 240 240'%3E%3Cg fill='none' stroke='%23B7CDF0' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='120' cy='120' r='44'/%3E%3Ccircle cx='120' cy='120' r='14'/%3E%3Cpath d='M120 22v28M120 190v28M22 120h28M190 120h28M52 52l20 20M168 168l20 20M52 188l20-20M168 72l20-20'/%3E%3Cpath d='M86 86l17 17M137 137l17 17M154 86l-17 17M103 153l-17 17'/%3E%3C/g%3E%3C/svg%3E")`;

  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-4"
      style={{
        background: "linear-gradient(180deg, #F4F7FC 0%, #EEF3FC 100%)",
        backgroundImage: `${backgroundPattern}, radial-gradient(circle at 20% 20%, rgba(93,143,219,0.08), transparent 28%), radial-gradient(circle at 80% 10%, rgba(93,143,219,0.06), transparent 22%)`,
        backgroundRepeat: "repeat, no-repeat",
        backgroundSize: "220px 220px, 100% 100%",
      }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-25" aria-hidden="true" />
      <div className="relative z-10 w-full max-w-sm rounded-md border border-border bg-panel p-8 shadow-panel">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 h-14 w-14 overflow-hidden rounded-md">
            <Image
              src="/ogigrid-logo.jpg"
              alt="Ogigrid"
              width={56}
              height={56}
              className="h-full w-full object-cover"
              priority
            />
          </div>
          <p className="text-lg font-semibold text-ink">OGIGRID</p>
          <p className="text-sm text-ink-faint">Password Recovery</p>
        </div>

        {submitted ? (
          <div className="space-y-4 text-center">
            <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800">
              If an account exists for {email}, a password reset link has been sent to your email address. Please check your inbox.
            </div>
            <Link href="/login" className="block w-full">
              <SecondaryButton className="w-full">Return to Log In</SecondaryButton>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-xs text-ink-muted leading-relaxed">
              Enter your work email address and we will send you a secure link to reset your password.
            </p>
            <Field label="Email">
              <input
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@ogigrid.com"
                required
                autoFocus
              />
            </Field>

            {error && <p className="text-sm text-status-notsubmitted">{error}</p>}

            <PrimaryButton type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Sending reset link..." : "Send Reset Link"}
            </PrimaryButton>

            <Link href="/login" className="block">
              <SecondaryButton type="button" className="w-full">
                Back to Log In
              </SecondaryButton>
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
