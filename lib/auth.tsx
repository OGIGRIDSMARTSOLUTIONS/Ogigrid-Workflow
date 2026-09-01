"use client";

import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { clearBrowserAppData, touchLastActivity } from "./clientSession";
import { Employee } from "./types";

interface AuthContextValue {
  currentUser: Employee | null;
  hydrated: boolean;
  workspaceHasUsers: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  signup: (input: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: "Admin" | "Employee";
  }) => Promise<{ ok: boolean; error?: string }>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [workspaceHasUsers, setWorkspaceHasUsers] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  async function refresh() {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const data = await res.json();
      setCurrentUser(data.user ?? null);
      setWorkspaceHasUsers(!!data.workspaceHasUsers);
    } catch {
      setCurrentUser(null);
    } finally {
      setHydrated(true);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function login(email: string, password: string) {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error ?? "Unable to log in." };
    setCurrentUser(data.user);
    setWorkspaceHasUsers(true);
    touchLastActivity();
    return { ok: true };
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", cache: "no-store", credentials: "same-origin" });
    setCurrentUser(null);
    clearBrowserAppData();
  }

  async function signup(input: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: "Admin" | "Employee";
  }) {
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error ?? "Unable to create the account." };
    setCurrentUser(data.user);
    setWorkspaceHasUsers(true);
    return { ok: true };
  }

  return (
    <AuthContext.Provider
      value={{ currentUser, hydrated, workspaceHasUsers, login, logout, signup, refresh }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
