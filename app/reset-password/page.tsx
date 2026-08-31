"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Field, PrimaryButton, SecondaryButton } from "@/components/ui/FormControls";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("Invalid or missing password reset token.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Unable to reset password.");
      }
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="space-y-4 text-center">
        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800">
          Your password has been reset successfully! All existing active sessions have been terminated for security.
        </div>
        <Link href="/login" className="block w-full">
          <PrimaryButton className="w-full">Log In Now</PrimaryButton>
        </Link>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="space-y-4 text-center">
        <div className="rounded-md border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-800">
          Invalid or expired password reset link. Please request a new one.
        </div>
        <Link href="/forgot-password" className="block w-full">
          <PrimaryButton className="w-full">Request New Link</PrimaryButton>
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-xs text-ink-muted leading-relaxed">
        Choose a new secure password for your Ogigrid Workflow account.
      </p>

      <Field label="New Password">
        <input
          type="password"
          className="input"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="At least 6 characters"
          required
          autoFocus
        />
      </Field>

      <Field label="Confirm New Password">
        <input
          type="password"
          className="input"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Repeat new password"
          required
        />
      </Field>

      {error && <p className="text-sm text-status-notsubmitted">{error}</p>}

      <PrimaryButton type="submit" className="w-full" disabled={submitting}>
        {submitting ? "Resetting password..." : "Set New Password"}
      </PrimaryButton>

      <Link href="/login" className="block">
        <SecondaryButton type="button" className="w-full">
          Back to Log In
        </SecondaryButton>
      </Link>
    </form>
  );
}

export default function ResetPasswordPage() {
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
          <p className="text-sm text-ink-faint">Set New Password</p>
        </div>

        <Suspense fallback={<p className="text-center text-xs text-ink-faint">Loading...</p>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
