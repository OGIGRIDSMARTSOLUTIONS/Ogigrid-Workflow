import { cookies } from "next/headers";
import crypto from "crypto";
import { pool, query, queryOne } from "@/lib/db";
import { mapEmployee } from "./mappers";

const COOKIE_NAME = "ogigrid_session";
const SESSION_TTL_DAYS = 30;

export async function createSession(employeeId: string) {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);
  await query(
    "INSERT INTO sessions (token, employee_id, expires_at) VALUES ($1, $2, $3)",
    [token, employeeId, expiresAt]
  );
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
  return token;
}

export async function destroySession() {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (token) {
    await query("DELETE FROM sessions WHERE token = $1", [token]);
  }
  cookies().delete(COOKIE_NAME);
}

// Returns the authenticated employee (mapped, no password) for the current
// request, or null if there is no valid session. This is the single
// server-side authorization checkpoint every API route relies on.
export async function getSessionEmployee() {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;

  const row = await queryOne<any>(
    `SELECT e.* FROM sessions s
     JOIN employees e ON e.id = s.employee_id
     WHERE s.token = $1 AND s.expires_at > now()`,
    [token]
  );
  if (!row) return null;
  if (row.status === "Inactive") return null;
  return mapEmployee(row);
}
