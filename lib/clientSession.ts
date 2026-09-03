"use client";

const LAST_ACTIVITY_KEY = "ogigrid_last_activity";
const LOGOUT_REASON_KEY = "ogigrid_logout_reason";

/** Wipe client-side app data from the browser (boss requirement: clear cache on idle logout). */
export function clearBrowserAppData(preserveIdleMessage = false) {
  const idleMessage = preserveIdleMessage ? sessionStorage.getItem(LOGOUT_REASON_KEY) : null;
  sessionStorage.clear();
  localStorage.clear();
  if (idleMessage) {
    sessionStorage.setItem(LOGOUT_REASON_KEY, idleMessage);
  }
}

export function markIdleLogout() {
  sessionStorage.setItem(LOGOUT_REASON_KEY, "idle");
}

export function touchLastActivity() {
  sessionStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
}

export function readLastActivity(): number {
  const stored = sessionStorage.getItem(LAST_ACTIVITY_KEY);
  const parsed = stored ? Number(stored) : NaN;
  return Number.isFinite(parsed) ? parsed : Date.now();
}

export function consumeIdleLogoutMessage(): string | null {
  const reason = sessionStorage.getItem(LOGOUT_REASON_KEY);
  sessionStorage.removeItem(LOGOUT_REASON_KEY);
  if (reason === "idle") {
    return "Your session ended after 15 minutes of inactivity. Please sign in again.";
  }
  return null;
}

/** Hard navigation — clears in-memory React/Next state and requires a fresh login. */
export function redirectToLogin() {
  window.location.replace("/login");
}
