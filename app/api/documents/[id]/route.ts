import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/server/guard";
import { deleteDocument, findDocumentById, listProjects, updateDocument } from "@/lib/server/repo";
import { isDangerousMimeType } from "@/lib/server/fileSafety";

// Secure Document retrieval / viewing endpoint
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const doc = await findDocumentById(params.id);
  if (!doc) {
    return NextResponse.json({ error: "Document not found." }, { status: 404 });
  }

  const projects = await listProjects();
  const project = projects.find((p) => p.id === doc.projectId);

  const isAdmin = user!.role === "Admin";
  const isMember = project ? project.memberIds.includes(user!.id) : false;

  if (!isAdmin && !isMember) {
    return NextResponse.json(
      { error: "Access denied. You are not a member of the project this document belongs to." },
      { status: 403 }
    );
  }

  return NextResponse.json({ document: doc });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const doc = await findDocumentById(params.id);
  if (!doc) return NextResponse.json({ error: "Document not found." }, { status: 404 });

  const projects = await listProjects();
  const project = projects.find((p) => p.id === doc.projectId);

  const isAdmin = user!.role === "Admin";
  const isMember = project ? project.memberIds.includes(user!.id) : false;

  if (!isAdmin && !isMember) {
    return NextResponse.json({ error: "Permission denied." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request body." }, { status: 400 });

  if (isDangerousMimeType(body.mimeType)) {
    return NextResponse.json(
      { error: "This file type isn't allowed for security reasons." },
      { status: 400 }
    );
  }

  if (body.projectId !== undefined) {
    const nextProject = projects.find((p) => p.id === body.projectId);
    if (!nextProject) {
      return NextResponse.json({ error: "Target project does not exist." }, { status: 400 });
    }
    if (!isAdmin && !nextProject.memberIds.includes(user!.id)) {
      return NextResponse.json(
        { error: "You cannot move this document to a project you are not a member of." },
        { status: 403 }
      );
    }
  }

  const updated = await updateDocument(params.id, {
    name: body.name,
    description: body.description,
    projectId: body.projectId,
    fileName: body.fileName,
    fileData: body.fileData,
    fileSize: body.fileSize,
    mimeType: body.mimeType,
  });

  return NextResponse.json({ document: updated });
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const doc = await findDocumentById(params.id);
  if (!doc) return NextResponse.json({ error: "Document not found." }, { status: 404 });

  const projects = await listProjects();
  const project = projects.find((p) => p.id === doc.projectId);

  const isAdmin = user!.role === "Admin";
  const isMember = project ? project.memberIds.includes(user!.id) : false;

  if (!isAdmin && !isMember) {
    return NextResponse.json({ error: "Permission denied." }, { status: 403 });
  }

  await deleteDocument(params.id);
  return NextResponse.json({ ok: true });
}
