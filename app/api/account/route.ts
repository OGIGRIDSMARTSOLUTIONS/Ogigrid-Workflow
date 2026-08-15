import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/server/guard";
import { deleteOwnAccount, findEmployeeByEmail, updateEmployee } from "@/lib/server/repo";
import { destroySession } from "@/lib/server/session";

export async function PATCH(request: Request) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request body." }, { status: 400 });

  if (body.email) {
    const existing = await findEmployeeByEmail(body.email);
    if (existing && existing.id !== user!.id) {
      return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
    }
  }

  // Self-service edits are limited to name/email/password — role and status
  // changes always go through the admin-only /api/employees/[id] route.
  const employee = await updateEmployee(user!.id, {
    name: body.name,
    email: body.email ? body.email.trim().toLowerCase() : undefined,
    password: body.password || undefined,
  });
  return NextResponse.json({ employee });
}

export async function DELETE() {
  const { user, error } = await requireAuth();
  if (error) return error;

  const result = await deleteOwnAccount(user!.id);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 403 });
  await destroySession();
  return NextResponse.json({ ok: true });
}
