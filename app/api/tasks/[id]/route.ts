import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/server/guard";
import { invalidUuidResponse, isUuid } from "@/lib/server/ids";
import { queryOne } from "@/lib/db";
import { updateTask, deleteTask } from "@/lib/server/repo";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const badId = invalidUuidResponse(params.id, "task ID");
  if (badId) return badId;

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request body." }, { status: 400 });

  const existing = await queryOne<any>(`SELECT * FROM tasks WHERE id = $1`, [params.id]);
  if (!existing) return NextResponse.json({ error: "Task not found." }, { status: 404 });

  const isAdmin = user!.role === "Admin";
  const isOwner = existing.assignee_id === user!.id;
  if (!isAdmin && !isOwner) {
    return NextResponse.json({ error: "You don't have permission to edit this task." }, { status: 403 });
  }

  // Employees may only ever change their own task's status/progress —
  // enforced here server-side, not just by disabling inputs in the UI.
  const patch = isAdmin
    ? {
        name: body.name,
        description: body.description,
        assigneeId: body.assigneeId !== undefined ? body.assigneeId : undefined,
        status: body.status,
        priority: body.priority,
        startDate: body.startDate,
        durationDays: body.durationDays !== undefined ? Number(body.durationDays) : undefined,
        deadline: body.deadline,
        progress: body.progress !== undefined ? Number(body.progress) : undefined,
        dependsOnTaskId: body.dependsOnTaskId !== undefined ? body.dependsOnTaskId : undefined,
      }
    : {
        status: body.status,
        progress: body.progress !== undefined ? Number(body.progress) : undefined,
      };

  if (patch.assigneeId !== undefined && patch.assigneeId !== null && !isUuid(patch.assigneeId)) {
    return NextResponse.json({ error: "Invalid assignee ID." }, { status: 400 });
  }
  if (patch.dependsOnTaskId !== undefined && patch.dependsOnTaskId !== null && !isUuid(patch.dependsOnTaskId)) {
    return NextResponse.json({ error: "Invalid dependency task ID." }, { status: 400 });
  }

  const task = await updateTask(params.id, patch, user!.id);
  return NextResponse.json({ task });
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { user, error } = await requireAuth();
  if (error) return error;
  if (user!.role !== "Admin") {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const badId = invalidUuidResponse(params.id, "task ID");
  if (badId) return badId;

  await deleteTask(params.id, user!.id);
  return NextResponse.json({ ok: true });
}
