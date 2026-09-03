import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/server/guard";
import { invalidUuidResponse } from "@/lib/server/ids";
import { deleteReportComment } from "@/lib/server/repo";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; commentId: string } }
) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const badReportId = invalidUuidResponse(params.id, "daily report ID");
  if (badReportId) return badReportId;
  const badCommentId = invalidUuidResponse(params.commentId, "comment ID");
  if (badCommentId) return badCommentId;

  const result = await deleteReportComment(params.commentId, user!.id, user!.role === "Admin");
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 403 });
  return NextResponse.json({ ok: true });
}
