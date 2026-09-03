import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/guard";
import { invalidUuidResponse, isUuid } from "@/lib/server/ids";
import { addProjectMember } from "@/lib/server/repo";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const badId = invalidUuidResponse(params.id, "project ID");
  if (badId) return badId;

  const body = await request.json().catch(() => null);
  if (!body?.employeeId) {
    return NextResponse.json({ error: "employeeId is required." }, { status: 400 });
  }
  if (!isUuid(body.employeeId)) {
    return NextResponse.json({ error: "Invalid employee ID." }, { status: 400 });
  }
  await addProjectMember(params.id, body.employeeId);
  return NextResponse.json({ ok: true });
}
