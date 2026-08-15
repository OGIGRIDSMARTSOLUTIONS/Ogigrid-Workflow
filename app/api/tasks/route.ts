import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/guard";
import { createTask } from "@/lib/server/repo";

export async function POST(request: Request) {
  const { user, error } = await requireAdmin();
  if (error) return error;

  const body = await request.json().catch(() => null);
  if (!body || !body.name || !body.projectId) {
    return NextResponse.json({ error: "Task name and project are required." }, { status: 400 });
  }

  const task = await createTask(
    {
      name: body.name,
      description: body.description ?? "",
      projectId: body.projectId,
      assigneeId: body.assigneeId || null,
      status: body.status ?? "To Do",
      priority: body.priority ?? "Medium",
      startDate: body.startDate ?? "",
      durationDays: Number(body.durationDays) || 1,
      deadline: body.deadline ?? "",
      progress: Number(body.progress) || 0,
      dependsOnTaskId: body.dependsOnTaskId || null,
    },
    user!.id
  );
  return NextResponse.json({ task });
}
