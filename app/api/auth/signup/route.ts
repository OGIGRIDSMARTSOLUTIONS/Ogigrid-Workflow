import { NextResponse } from "next/server";
import { countEmployees, createEmployee, findEmployeeByEmail, getWorkspaceSetting } from "@/lib/server/repo";
import { createSession } from "@/lib/server/session";
import { isRateLimited, getClientIp } from "@/lib/server/rateLimit";
import { validateEmail } from "@/lib/emailValidation";
import { validatePassword } from "@/lib/passwordValidation";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (isRateLimited(`signup:${ip}`, 5, 15 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many signup attempts. Please wait a while and try again." },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request body." }, { status: 400 });

  const legacyName = (body.name ?? "").trim();
  const legacyParts = legacyName ? legacyName.split(/\s+/).filter(Boolean) : [];
  const firstNameFromLegacy = legacyParts[0] ?? "";
  const lastNameFromLegacy = legacyParts.length > 1 ? legacyParts.slice(1).join(" ") : "";

  const firstName = (body.firstName ?? firstNameFromLegacy).trim();
  const lastName = (body.lastName ?? lastNameFromLegacy).trim();
  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";

  if (!firstName || !lastName || !email || !password) {
    return NextResponse.json({ error: "First name, last name, email and password are required." }, { status: 400 });
  }

  const emailCheck = validateEmail(email);
  if (!emailCheck.valid) {
    return NextResponse.json({ error: emailCheck.error, suggestion: emailCheck.suggestion }, { status: 400 });
  }

  const passwordCheck = validatePassword(password);
  if (!passwordCheck.valid) {
    return NextResponse.json({ error: passwordCheck.error }, { status: 400 });
  }

  const existing = await findEmployeeByEmail(email);
  if (existing) {
    return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
  }

  const employeeCount = await countEmployees();
  const isFirstAccount = employeeCount === 0;

  // Require invite code for all signups after the first account
  if (!isFirstAccount) {
    const inviteCode = (body.inviteCode ?? "").trim();
    const expectedCode = await getWorkspaceSetting("invite_code");
    if (!inviteCode) {
      return NextResponse.json({ error: "Invite code is required to sign up." }, { status: 400 });
    }
    if (inviteCode.toUpperCase() !== expectedCode.toUpperCase()) {
      return NextResponse.json({ error: "Invalid invite code. Please contact your admin for the correct code." }, { status: 403 });
    }
  }
  const role: "Admin" | "Employee" = isFirstAccount ? "Admin" : "Employee";

  // Public signup is only allowed to create an Admin on the very first account.
  // Once the workspace has users, all public signups are forced to Employee
  // regardless of any role the client attempts to send.
  const employee = await createEmployee({
    firstName,
    lastName,
    email,
    password,
    role,
    departments: [],
    status: "Active",
    isPrimaryAdmin: isFirstAccount,
  });

  await createSession(employee.id);
  return NextResponse.json({ user: employee });
}
