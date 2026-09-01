import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/server/guard";
<<<<<<< HEAD
import { createReportComment } from "@/lib/server/repo";
=======
import {
  createDailyReportComment,
  findDailyReportById,
  listDailyReportComments,
} from "@/lib/server/repo";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const { error } = await requireAuth();
  if (error) return error;

  const report = await findDailyReportById(params.id);
  if (!report) {
    return NextResponse.json({ error: "Daily report not found." }, { status: 404 });
  }

  const comments = await listDailyReportComments(params.id);
  return NextResponse.json({ comments });
}
>>>>>>> 4b5b146cb59da56315b0b76f846056cfb5f4e25c

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const { user, error } = await requireAuth();
  if (error) return error;

<<<<<<< HEAD
  const body = await request.json().catch(() => null);
  const text = (body?.body ?? "").trim();
  if (!text) {
    return NextResponse.json({ error: "Comment cannot be empty." }, { status: 400 });
  }

  const comment = await createReportComment(params.id, user!.id, text);
=======
  const report = await findDailyReportById(params.id);
  if (!report) {
    return NextResponse.json({ error: "Daily report not found." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const commentBody = typeof body?.body === "string" ? body.body.trim() : "";
  if (!commentBody) {
    return NextResponse.json({ error: "Comment cannot be empty." }, { status: 400 });
  }

  const comment = await createDailyReportComment({
    reportId: params.id,
    authorId: user!.id,
    body: commentBody,
  });

  if (!comment) {
    return NextResponse.json({ error: "Unable to add comment." }, { status: 500 });
  }

>>>>>>> 4b5b146cb59da56315b0b76f846056cfb5f4e25c
  return NextResponse.json({ comment });
}
