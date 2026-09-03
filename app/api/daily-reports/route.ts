import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/server/guard";
import { createDailyReport } from "@/lib/server/repo";

export async function POST(request: Request) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const body = await request.json().catch(() => null);
  if (!body || !body.date) {
    return NextResponse.json({ error: "Date is required." }, { status: 400 });
  }

  // The employee is always the authenticated user — nobody can submit a
  // report pretending to be someone else, regardless of what the client sends.
  const result = await createDailyReport({
    employeeId: user!.id,
    date: body.date,
    workedOn: body.workedOn ?? "",
    completed: body.completed ?? "",
    remaining: body.remaining ?? "",
    blockers: body.blockers ?? "",
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ report: result.report });
}
