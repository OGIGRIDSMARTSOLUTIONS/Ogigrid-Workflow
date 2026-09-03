import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/server/guard";
import { invalidUuidResponse } from "@/lib/server/ids";
import { findDailyReportById, updateDailyReport } from "@/lib/server/repo";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const { error } = await requireAuth();
  if (error) return error;

  const badId = invalidUuidResponse(params.id, "daily report ID");
  if (badId) return badId;

  const report = await findDailyReportById(params.id);
  if (!report) {
    return NextResponse.json({ error: "Daily report not found." }, { status: 404 });
  }

  return NextResponse.json({ report });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const badId = invalidUuidResponse(params.id, "daily report ID");
  if (badId) return badId;

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request body." }, { status: 400 });

  const result = await updateDailyReport(
    params.id,
    {
      date: body.date,
      workedOn: body.workedOn,
      completed: body.completed,
      remaining: body.remaining,
      blockers: body.blockers,
    },
    user!.id,
    user!.role === "Admin"
  );

  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 403 });
  return NextResponse.json({ report: result.report });
}
