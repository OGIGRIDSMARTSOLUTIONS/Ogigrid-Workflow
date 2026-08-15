"use client";

import { ReactNode, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

const PUBLIC_PATHS = ["/login"];

export function RouteGuard({ children }: { children: ReactNode }) {
  const { currentUser, hydrated } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isPublic = PUBLIC_PATHS.includes(pathname ?? "");

  useEffect(() => {
    if (!hydrated) return;
    if (!currentUser && !isPublic) {
      router.replace("/login");
    }
    if (currentUser && pathname === "/login") {
      router.replace("/dashboard");
    }
  }, [hydrated, currentUser, isPublic, pathname, router]);

  if (!hydrated) {
    return (
      <div className="flex h-screen items-center justify-center bg-canvas">
        <p className="text-sm text-ink-faint">Loading Ogigrid Workflow…</p>
      </div>
    );
  }

  if (!currentUser && !isPublic) {
    return (
      <div className="flex h-screen items-center justify-center bg-canvas">
        <p className="text-sm text-ink-faint">Redirecting to login…</p>
      </div>
    );
  }

  return <>{children}</>;
}
