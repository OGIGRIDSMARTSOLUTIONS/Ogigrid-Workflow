import { NextResponse } from "next/server";
import { requireAdmin, requireAuth } from "@/lib/server/guard";
import { invalidUuidResponse } from "@/lib/server/ids";
import { deleteProject, listProjects, updateProject } from "@/lib/server/repo";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const badId = invalidUuidResponse(params.id, "project ID");
  if (badId) return badId;

  const projects = await listProjects();
  const project = projects.find((p) => p.id === params.id);
  if (!project) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  const isAdmin = user!.role === "Admin";
  const isMember = project.memberIds.includes(user!.id);

  if (!isAdmin && !isMember) {
    return NextResponse.json(
      { error: "Access denied. You are not a member of this project." },
      { status: 403 }
    );
  }

  return NextResponse.json({ project });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const badId = invalidUuidResponse(params.id, "project ID");
  if (badId) return badId;

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

  const badId = invalidUuidResponse(params.id, "project ID");
  if (badId) return badId;

  await deleteProject(params.id, user!.id);
  return NextResponse.json({ ok: true });
}
