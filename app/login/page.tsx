"use client";

import { useState } from "react";
import Image from "next/image";
import { useAuth } from "@/lib/auth";
import { Field, PrimaryButton, SecondaryButton } from "@/components/ui/FormControls";
import { Role } from "@/lib/types";

type Mode = "login" | "signup";

export default function LoginPage() {
  const { hydrated, workspaceHasUsers, login, signup } = useAuth();
  const isFirstRun = hydrated && !workspaceHasUsers;

  const [mode, setMode] = useState<Mode>("login");
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [signupForm, setSignupForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "Employee" as Role,
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
    if (signupForm.password.length < 4) {
      setError("Password must be at least 4 characters.");
      return;
    }
    setSubmitting(true);
    const result = await signup(signupForm);
    setSubmitting(false);
    if (!result.ok) setError(result.error ?? "Unable to create the account.");
  }

  if (!hydrated) {
    return (
      <div className="flex h-screen items-center justify-center bg-canvas">
        <p className="text-sm text-ink-faint">Loading Ogigrid Workflow…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-sm rounded-md border border-border bg-panel p-8 shadow-panel">
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
              <Field label="Full name">
                <input
                  className="input"
                  value={signupForm.name}
                  onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })}
                  required
                  autoFocus
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
