"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useAuth } from "@/lib/auth";
import { consumeIdleLogoutMessage } from "@/lib/clientSession";
import { Field, PrimaryButton, SecondaryButton } from "@/components/ui/FormControls";
import { Role } from "@/lib/types";

type Mode = "login" | "signup";

export default function LoginPage() {
  const { hydrated, workspaceHasUsers, login, signup } = useAuth();
  const isFirstRun = hydrated && !workspaceHasUsers;

  const [mode, setMode] = useState<Mode>("login");
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [signupForm, setSignupForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "Employee" as Role,
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const idleMessage = consumeIdleLogoutMessage();
    if (idleMessage) setError(idleMessage);
  }, []);

  const effectiveMode: Mode = isFirstRun ? "signup" : mode;

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = await login(loginForm.email, loginForm.password);
    setSubmitting(false);
    if (!result.ok) setError(result.error ?? "Unable to log in.");
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!signupForm.firstName.trim() || !signupForm.lastName.trim()) {
      setError("First name and last name are required.");
      return;
    }
    if (signupForm.password.length < 4) {
      setError("Password must be at least 4 characters.");
      return;
    }
    setSubmitting(true);
    const result = await signup({
      firstName: signupForm.firstName.trim(),
      lastName: signupForm.lastName.trim(),
      email: signupForm.email,
      password: signupForm.password,
      role: signupForm.role,
    });
    setSubmitting(false);
    if (!result.ok) setError(result.error ?? "Unable to create the account.");
  }

  const backgroundPattern =
    `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240' viewBox='0 0 240 240'%3E%3Cg fill='none' stroke='%23B7CDF0' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='120' cy='120' r='44'/%3E%3Ccircle cx='120' cy='120' r='14'/%3E%3Cpath d='M120 22v28M120 190v28M22 120h28M190 120h28M52 52l20 20M168 168l20 20M52 188l20-20M168 72l20-20'/%3E%3Cpath d='M86 86l17 17M137 137l17 17M154 86l-17 17M103 153l-17 17'/%3E%3C/g%3E%3C/svg%3E")`;

  if (!hydrated) {
    return (
      <div
        className="relative flex h-screen items-center justify-center overflow-hidden px-4"
        style={{
          background: "linear-gradient(180deg, #F4F7FC 0%, #EEF3FC 100%)",
          backgroundImage: `${backgroundPattern}, radial-gradient(circle at 20% 20%, rgba(93,143,219,0.12), transparent 32%), radial-gradient(circle at 80% 10%, rgba(93,143,219,0.08), transparent 24%)`,
          backgroundRepeat: "repeat, no-repeat",
          backgroundSize: "220px 220px, 100% 100%",
        }}
      >
        <div className="pointer-events-none absolute inset-0 opacity-30" aria-hidden="true" />
        <p className="relative z-10 text-sm text-ink-faint">Loading Ogigrid Workflow…</p>
      </div>
    );
  }

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
          <p className="text-sm text-ink-faint">Workflow</p>
        </div>

        {effectiveMode === "signup" ? (
          <>
            {isFirstRun ? (
              <p className="mb-4 text-sm text-ink-muted">
                This workspace is empty. The account you create here becomes the workspace's{" "}
                <strong className="text-ink">Primary Administrator</strong> — it has full
                administrator access and can never be removed, demoted, or deactivated. Everyone
                else can be added afterwards.
              </p>
            ) : (
              <p className="mb-4 text-sm text-ink-muted">
                Create your Ogigrid account. Choose whether you're joining as an Administrator or
                an Employee.
              </p>
            )}
            <form onSubmit={handleSignup} className="space-y-4">
              <Field label="First Name">
                <input
                  className="input"
                  value={signupForm.firstName}
                  onChange={(e) => setSignupForm({ ...signupForm, firstName: e.target.value })}
                  required
                  autoFocus
                />
              </Field>
              <Field label="Last Name">
                <input
                  className="input"
                  value={signupForm.lastName}
                  onChange={(e) => setSignupForm({ ...signupForm, lastName: e.target.value })}
                  required
                />
              </Field>
              <Field label="Email">
                <input
                  type="email"
                  className="input"
                  value={signupForm.email}
                  onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                  required
                />
              </Field>
              <Field label="Password">
                <input
                  type="password"
                  className="input"
                  value={signupForm.password}
                  onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                  required
                />
              </Field>
              {!isFirstRun && (
                <Field label="Account type">
                  <select
                    className="input"
                    value={signupForm.role}
                    onChange={(e) => setSignupForm({ ...signupForm, role: e.target.value as Role })}
                  >
                    <option value="Employee">Employee</option>
                    <option value="Admin">Administrator</option>
                  </select>
                </Field>
              )}
              {error && <p className="text-sm text-status-notsubmitted">{error}</p>}
              <PrimaryButton type="submit" className="w-full" disabled={submitting}>
                {isFirstRun ? "Create Workspace" : "Create Account"}
              </PrimaryButton>
            </form>
            {!isFirstRun && (
              <SecondaryButton type="button" className="mt-3 w-full" onClick={() => setMode("login")}>
                Already have an account? Log in
              </SecondaryButton>
            )}
          </>
        ) : (
          <>
            <p className="mb-4 text-sm text-ink-muted">Sign in to your Ogigrid workspace.</p>
            <form onSubmit={handleLogin} className="space-y-4">
              <Field label="Email">
                <input
                  type="email"
                  className="input"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  required
                  autoFocus
                />
              </Field>
              <Field label="Password">
                <input
                  type="password"
                  className="input"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  required
                />
              </Field>
              <div className="flex justify-end">
                <a
                  href="/forgot-password"
                  className="text-xs font-medium text-brand-600 hover:underline"
                >
                  Forgot password?
                </a>
              </div>
              {error && <p className="text-sm text-status-notsubmitted">{error}</p>}
              <PrimaryButton type="submit" className="w-full" disabled={submitting}>
                Log In
              </PrimaryButton>
            </form>
            <SecondaryButton type="button" className="mt-3 w-full" onClick={() => setMode("signup")}>
              New here? Create an account
            </SecondaryButton>
          </>
        )}
      </div>
    </div>
  );
}
