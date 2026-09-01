import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/guard";
import { createEmployee, findEmployeeByEmail } from "@/lib/server/repo";

export async function POST(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request body." }, { status: 400 });

  const name = (body.name ?? "").trim();
  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";
  const role = body.role === "Admin" ? "Admin" : "Employee";
  const departments = Array.isArray(body.departments) ? body.departments : [];
  const status = body.status === "Inactive" ? "Inactive" : "Active";

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Name, email and password are required." }, { status: 400 });
  }

  const existing = await findEmployeeByEmail(email);
  if (existing) {
    return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
  }

  const employee = await createEmployee({
    name,
    email,
    password,
    role,
    departments,
    status,
    jobTitle: typeof body.jobTitle === "string" ? body.jobTitle : "",
  });
  return NextResponse.json({ employee });
}
