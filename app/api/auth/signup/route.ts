import { NextResponse } from "next/server";
import { countEmployees, createEmployee, findEmployeeByEmail } from "@/lib/server/repo";
import { createSession } from "@/lib/server/session";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request body." }, { status: 400 });

  const name = (body.name ?? "").trim();
  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";
  let role: "Admin" | "Employee" = body.role === "Admin" ? "Admin" : "Employee";

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Name, email and password are required." }, { status: 400 });
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
  // The very first account in the workspace is always the Admin — and the
  // permanent Primary Administrator — regardless of what was submitted.
  if (isFirstAccount) role = "Admin";

  const employee = await createEmployee({
    name,
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
