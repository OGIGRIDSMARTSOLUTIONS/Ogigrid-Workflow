import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/guard";
import { invalidUuidResponse } from "@/lib/server/ids";
import { removeProjectMember } from "@/lib/server/repo";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; employeeId: string } }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const badProjectId = invalidUuidResponse(params.id, "project ID");
  if (badProjectId) return badProjectId;
  const badEmployeeId = invalidUuidResponse(params.employeeId, "employee ID");
  if (badEmployeeId) return badEmployeeId;

  await removeProjectMember(params.id, params.employeeId);
  return NextResponse.json({ ok: true });
}
