import { NextResponse } from "next/server";
import { getSessionEmployee } from "./session";

// Every mutating/reading API route calls this first — permissions are
// enforced here on the server, not just by hiding buttons in the UI.
export async function requireAuth() {
  const user = await getSessionEmployee();
  if (!user) {
    return { user: null as null, error: NextResponse.json({ error: "Not authenticated." }, { status: 401 }) };
  }
  return { user, error: null };
}

export async function requireAdmin() {
  const { user, error } = await requireAuth();
  if (error) return { user: null as null, error };
  if (user!.role !== "Admin") {
    return { user: null as null, error: NextResponse.json({ error: "Admin access required." }, { status: 403 }) };
  }
  return { user, error: null };
}
