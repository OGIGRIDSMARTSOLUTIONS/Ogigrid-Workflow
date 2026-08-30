import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/server/guard";
import { deleteOwnAccount, findEmployeeByEmail, findEmployeeById, updateEmployee } from "@/lib/server/repo";
import { destroySession } from "@/lib/server/session";
import { verifyPassword } from "@/lib/server/password";

export async function PATCH(request: Request) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request body." }, { status: 400 });

  const existingUser = await findEmployeeById(user!.id);
  if (!existingUser) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  // Email validation & uniqueness
  if (body.email !== undefined) {
    const email = (body.email || "").trim().toLowerCase();
    if (!email) {
      return NextResponse.json({ error: "Email address cannot be empty." }, { status: 400 });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }
    const existing = await findEmployeeByEmail(email);
    if (existing && existing.id !== user!.id) {
      return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
    }
  }

  // Password verification & change
  const newPassword = body.newPassword || body.password;
  if (newPassword) {
    if (typeof newPassword !== "string" || newPassword.trim().length === 0) {
      return NextResponse.json({ error: "New password cannot be empty." }, { status: 400 });
    }
    if (newPassword.length < 6) {
      return NextResponse.json({ error: "New password must be at least 6 characters long." }, { status: 400 });
    }
    if (!body.currentPassword) {
      return NextResponse.json(
        { error: "Please enter your current password to set a new password." },
        { status: 400 }
      );
    }
    const isValid = await verifyPassword(body.currentPassword, existingUser.password_hash);
    if (!isValid) {
      return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
    }
  }

  // First name & Last name handling
  let firstName = body.firstName !== undefined ? body.firstName.trim() : undefined;
  let lastName = body.lastName !== undefined ? body.lastName.trim() : undefined;
  let name = body.name !== undefined ? body.name.trim() : undefined;

  if (firstName !== undefined || lastName !== undefined) {
    const curFirst = firstName !== undefined ? firstName : (existingUser.first_name ?? "");
    const curLast = lastName !== undefined ? lastName : (existingUser.last_name ?? "");
    name = [curFirst, curLast].filter(Boolean).join(" ").trim();
    if (!name) {
      return NextResponse.json({ error: "Name cannot be empty." }, { status: 400 });
    }
  } else if (name !== undefined) {
    if (!name) {
      return NextResponse.json({ error: "Name cannot be empty." }, { status: 400 });
    }
    const parts = name.split(/\s+/).filter(Boolean);
    firstName = parts[0] || "";
    lastName = parts.slice(1).join(" ");
  }

  // Self-service edits are limited to name/email/password — role and status
  // changes always go through the admin-only /api/employees/[id] route.
  const employee = await updateEmployee(user!.id, {
    name,
    firstName,
    lastName,
    email: body.email ? body.email.trim().toLowerCase() : undefined,
    password: newPassword || undefined,
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
