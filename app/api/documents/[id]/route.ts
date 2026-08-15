import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/guard";
import { deleteDocument, updateDocument } from "@/lib/server/repo";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request body." }, { status: 400 });

  const document = await updateDocument(params.id, {
    name: body.name,
    description: body.description,
    projectId: body.projectId !== undefined ? body.projectId || null : undefined,
  });
  if (!document) return NextResponse.json({ error: "Document not found." }, { status: 404 });
  return NextResponse.json({ document });
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;
  await deleteDocument(params.id);
  return NextResponse.json({ ok: true });
}
