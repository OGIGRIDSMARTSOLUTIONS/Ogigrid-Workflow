import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/server/guard";
<<<<<<< HEAD
import { updateDailyReport } from "@/lib/server/repo";
=======
import { findDailyReportById, updateDailyReport } from "@/lib/server/repo";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const { error } = await requireAuth();
  if (error) return error;

  const report = await findDailyReportById(params.id);
  if (!report) {
    return NextResponse.json({ error: "Daily report not found." }, { status: 404 });
  }

  return NextResponse.json({ report });
}
>>>>>>> 4b5b146cb59da56315b0b76f846056cfb5f4e25c

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { user, error } = await requireAuth();
  if (error) return error;

<<<<<<< HEAD
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
=======
  const report = await findDailyReportById(params.id);
  if (!report) {
    return NextResponse.json({ error: "Daily report not found." }, { status: 404 });
  }

  const isOwner = report.employeeId === user!.id;
  const isAdmin = user!.role === "Admin";
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "You can only edit your own daily reports." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!body.date) {
    return NextResponse.json({ error: "Report date is required." }, { status: 400 });
  }

  const updated = await updateDailyReport(params.id, {
    date: body.date,
    workedOn: body.workedOn ?? "",
    completed: body.completed ?? "",
    remaining: body.remaining ?? "",
    blockers: body.blockers ?? "",
  });

  return NextResponse.json({ report: updated });
>>>>>>> 4b5b146cb59da56315b0b76f846056cfb5f4e25c
}
