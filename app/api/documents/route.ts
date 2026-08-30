import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/server/guard";
import { createDocument, listProjects } from "@/lib/server/repo";

export async function POST(request: Request) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request body." }, { status: 400 });

  const { name, description, projectId, fileName, fileData, fileSize, mimeType } = body;

  if (!projectId || typeof projectId !== "string") {
    return NextResponse.json({ error: "Every document must be associated with a project." }, { status: 400 });
  }

  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Document name is required." }, { status: 400 });
  }

  // Check if project exists
  const projects = await listProjects();
  const project = projects.find((p) => p.id === projectId);
  if (!project) {
    return NextResponse.json({ error: "Selected project was not found." }, { status: 404 });
  }

  const document = await createDocument({
    name: name.trim(),
    description: (description ?? "").trim(),
    projectId,
    fileName: fileName || name.trim(),
    fileData: fileData || undefined,
    fileSize: fileSize !== undefined ? Number(fileSize) : undefined,
    mimeType: mimeType || undefined,
  });

  return NextResponse.json({ document });
}
