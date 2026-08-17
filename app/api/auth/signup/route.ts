import { NextResponse } from "next/server";
import { countEmployees, createEmployee, findEmployeeByEmail } from "@/lib/server/repo";
import { createSession } from "@/lib/server/session";

export async function POST(request: Request) {
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
  if (password.length < 4) {
    return NextResponse.json({ error: "Password must be at least 4 characters." }, { status: 400 });
  }

  const existing = await findEmployeeByEmail(email);
  if (existing) {
    return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
  }

  const employeeCount = await countEmployees();
  const isFirstAccount = employeeCount === 0;
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
