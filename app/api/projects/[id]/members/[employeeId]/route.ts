import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/guard";
import { removeProjectMember } from "@/lib/server/repo";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; employeeId: string } }
) {
  const { error } = await requireAdmin();
  if (error) return error;
  await removeProjectMember(params.id, params.employeeId);
  return NextResponse.json({ ok: true });
}
