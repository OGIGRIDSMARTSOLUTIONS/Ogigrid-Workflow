import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/server/guard";
import { query, queryOne } from "@/lib/db";
import { updateTask, deleteTask } from "@/lib/server/repo";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { user, error } = await requireAuth();
  if (error) return error;

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
        durationDays: body.durationDays !== undefined ? Number(body.durationDays) : undefined,
        progress: body.progress !== undefined ? Number(body.progress) : undefined,
        dependsOnTaskId: body.dependsOnTaskId !== undefined ? body.dependsOnTaskId : undefined,
      }
    : {
        status: body.status,
        progress: body.progress !== undefined ? Number(body.progress) : undefined,
      };

  const task = await updateTask(params.id, patch, user!.id);
  return NextResponse.json({ task });
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { user, error } = await requireAuth();
  if (error) return error;
  if (user!.role !== "Admin") {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }
  await deleteTask(params.id, user!.id);
  return NextResponse.json({ ok: true });
}
