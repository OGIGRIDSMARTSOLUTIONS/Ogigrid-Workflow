import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/server/guard";
import { updateDailyReport } from "@/lib/server/repo";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { user, error } = await requireAuth();
  if (error) return error;

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
