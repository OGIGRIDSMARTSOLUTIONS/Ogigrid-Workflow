import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/guard";
import { deactivateEmployee, updateEmployee } from "@/lib/server/repo";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request body." }, { status: 400 });

  // Workspace-level attributes only (role, departments, status)
  // Personal information (name, email, password) can only be changed by the employee themselves via Account Settings
  const employee = await updateEmployee(params.id, {
    role: body.role,
    departments: body.departments,
    status: body.status,
  });

  if (!employee) return NextResponse.json({ error: "Employee not found." }, { status: 404 });
  return NextResponse.json({ employee });
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { user, error } = await requireAdmin();
  if (error) return error;

  const body = await request.json().catch(() => ({}));
  const strategy =
    body.reassignToEmployeeId
      ? ({ type: "reassign", toEmployeeId: body.reassignToEmployeeId } as const)
      : ({ type: "unassign" } as const);

  const result = await deactivateEmployee(params.id, strategy, user!.id);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 403 });
  return NextResponse.json({ ok: true });
}
