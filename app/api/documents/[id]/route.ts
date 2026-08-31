import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/server/guard";
import { deleteDocument, findDocumentById, listProjects, updateDocument } from "@/lib/server/repo";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const { error } = await requireAuth();
  if (error) return error;

  const doc = await findDocumentById(params.id);
  if (!doc) {
    return NextResponse.json({ error: "Document not found." }, { status: 404 });
  }

  return NextResponse.json({ document: doc });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { error } = await requireAuth();
  if (error) return error;

  const doc = await findDocumentById(params.id);
  if (!doc) return NextResponse.json({ error: "Document not found." }, { status: 404 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request body." }, { status: 400 });

  if (body.projectId !== undefined) {
    const projects = await listProjects();
    const nextProject = projects.find((p) => p.id === body.projectId);
    if (!nextProject) {
      return NextResponse.json({ error: "Target project does not exist." }, { status: 400 });
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

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const { error } = await requireAuth();
  if (error) return error;

  const doc = await findDocumentById(params.id);
  if (!doc) return NextResponse.json({ error: "Document not found." }, { status: 404 });

  await deleteDocument(params.id);
  return NextResponse.json({ ok: true });
}
