import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/server/guard";
import { invalidUuidResponse } from "@/lib/server/ids";
import {
  createReportComment,
  findDailyReportById,
  listDailyReportComments,
} from "@/lib/server/repo";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const { error } = await requireAuth();
  if (error) return error;

  const badId = invalidUuidResponse(params.id, "daily report ID");
  if (badId) return badId;

  const report = await findDailyReportById(params.id);
  if (!report) {
    return NextResponse.json({ error: "Daily report not found." }, { status: 404 });
  }

  const comments = await listDailyReportComments(params.id);
  return NextResponse.json({ comments });
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const badId = invalidUuidResponse(params.id, "daily report ID");
  if (badId) return badId;

  const report = await findDailyReportById(params.id);
  if (!report) {
    return NextResponse.json({ error: "Daily report not found." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const text = (body?.body ?? "").trim();
  if (!text) {
    return NextResponse.json({ error: "Comment cannot be empty." }, { status: 400 });
  }

  const comment = await createReportComment(params.id, user!.id, text);
  return NextResponse.json({ comment });
}
