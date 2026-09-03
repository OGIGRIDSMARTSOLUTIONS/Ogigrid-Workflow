"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import {
  clearBrowserAppData,
  markIdleLogout,
  readLastActivity,
  redirectToLogin,
  touchLastActivity,
} from "@/lib/clientSession";

import { IDLE_TIMEOUT_MS } from "@/lib/sessionTiming";

// Boss requirement: end session after a short period of inactivity.
export { IDLE_TIMEOUT_MS };
const CHECK_INTERVAL_MS = 30 * 1000;

// Real user actions only — not mousemove/scroll (those never let the timer expire).
const ACTIVITY_EVENTS = ["mousedown", "keydown", "touchstart", "click"] as const;

async function endSessionOnServer() {
  await fetch("/api/auth/logout", {
    method: "POST",
    cache: "no-store",
    credentials: "same-origin",
  }).catch(() => undefined);
}

export function useIdleLogout() {
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    if (!sessionStorage.getItem("ogigrid_last_activity")) {
      touchLastActivity();
    }

    let loggingOut = false;

    async function forceIdleLogout() {
      if (loggingOut) return;
      loggingOut = true;

      markIdleLogout();
      await endSessionOnServer();
      clearBrowserAppData(true);
      redirectToLogin();
    }

    function checkIdle() {
      const idleFor = Date.now() - readLastActivity();
      if (idleFor >= IDLE_TIMEOUT_MS) {
        void forceIdleLogout();
      }
    }

    function onActivity() {
      touchLastActivity();
    }

    function onVisibilityChange() {
      if (document.visibilityState === "visible") {
        checkIdle();
      }
    }

    checkIdle();
    const intervalId = window.setInterval(checkIdle, CHECK_INTERVAL_MS);
    ACTIVITY_EVENTS.forEach((evt) => window.addEventListener(evt, onActivity, { passive: true }));
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      ACTIVITY_EVENTS.forEach((evt) => window.removeEventListener(evt, onActivity));
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [currentUser]);
}
