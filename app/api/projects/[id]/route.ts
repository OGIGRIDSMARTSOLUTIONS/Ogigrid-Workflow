import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/guard";
import { deleteProject, updateProject } from "@/lib/server/repo";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request body." }, { status: 400 });

  const project = await updateProject(params.id, {
    description: body.description,
    status: body.status,
    startDate: body.startDate,
    deadline: body.deadline,
  });
  if (!project) return NextResponse.json({ error: "Project not found." }, { status: 404 });
  return NextResponse.json({ project });
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { user, error } = await requireAdmin();
  if (error) return error;
  await deleteProject(params.id, user!.id);
  return NextResponse.json({ ok: true });
}
