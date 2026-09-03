import { cookies } from "next/headers";
import crypto from "crypto";
import { query, queryOne } from "@/lib/db";
import { mapEmployee } from "./mappers";
import { IDLE_TIMEOUT_MS } from "@/lib/sessionTiming";

const COOKIE_NAME = "ogigrid_session";
// Cookie and DB session both expire after 15 minutes without a request.
// Each authenticated request slides expiry forward so active users stay in.
const SESSION_TTL_MS = IDLE_TIMEOUT_MS;

function sessionCookieOptions(expiresAt: Date) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  };
}

export async function createSession(employeeId: string) {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await query(
    "INSERT INTO sessions (token, employee_id, expires_at) VALUES ($1, $2, $3)",
    [token, employeeId, expiresAt]
  );
  cookies().set(COOKIE_NAME, token, sessionCookieOptions(expiresAt));
  return token;
}

export async function destroySession() {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (token) {
    await query("DELETE FROM sessions WHERE token = $1", [token]);
  }
  // Explicitly expire the cookie so the browser cannot reuse it.
  cookies().set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });
}

// Returns the authenticated employee (mapped, no password) for the current
// request, or null if there is no valid session. This is the single
// server-side authorization checkpoint every API route relies on.
export async function getSessionEmployee() {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;

  const row = await queryOne<any>(
    `SELECT e.*, s.expires_at AS session_expires_at FROM sessions s
     JOIN employees e ON e.id = s.employee_id
     WHERE s.token = $1 AND s.expires_at > now()`,
    [token]
  );
  if (!row) return null;
  if (row.status === "Inactive") return null;

  // Sliding 15-minute window: any authenticated request pushes expiry forward.
  const newExpiry = new Date(Date.now() + SESSION_TTL_MS);
  await query("UPDATE sessions SET expires_at = $1 WHERE token = $2", [newExpiry, token]);
  cookies().set(COOKIE_NAME, token, sessionCookieOptions(newExpiry));

  return mapEmployee(row);
}

// Used after a password reset so a stolen or still-open session elsewhere
// doesn't survive the account owner changing their password.
export async function destroyAllSessionsForEmployee(employeeId: string) {
  await query("DELETE FROM sessions WHERE employee_id = $1", [employeeId]);
}
