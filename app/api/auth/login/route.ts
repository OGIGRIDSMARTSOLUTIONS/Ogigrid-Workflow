import { NextResponse } from "next/server";
import { findEmployeeByEmail } from "@/lib/server/repo";
import { verifyPassword } from "@/lib/server/password";
import { createSession } from "@/lib/server/session";
import { mapEmployee } from "@/lib/server/mappers";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request body." }, { status: 400 });

  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const row = await findEmployeeByEmail(email);
  if (!row) {
    return NextResponse.json({ error: "No account found with that email." }, { status: 401 });
  }
  if (row.status === "Inactive") {
    return NextResponse.json({ error: "This account has been deactivated." }, { status: 403 });
  }
  const valid = await verifyPassword(password, row.password_hash);
  if (!valid) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  await createSession(row.id);
  return NextResponse.json({ user: mapEmployee(row) });
}
