import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/server/guard";
import { createDocument, listProjects } from "@/lib/server/repo";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export async function POST(request: Request) {
  const { error } = await requireAuth();
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

  if (!fileData || typeof fileData !== "string") {
    return NextResponse.json({ error: "Please select a file to upload." }, { status: 400 });
  }

  const parsedFileSize = fileSize !== undefined ? Number(fileSize) : 0;
  if (parsedFileSize > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json({ error: "File is too large. Maximum size is 5 MB." }, { status: 400 });
  }

  const projects = await listProjects();
  const project = projects.find((p) => p.id === projectId);
  if (!project) {
    return NextResponse.json({ error: "Selected project was not found." }, { status: 404 });
  }

  try {
    const document = await createDocument({
      name: name.trim(),
      description: (description ?? "").trim(),
      projectId,
      fileName: fileName || name.trim(),
      fileData,
      fileSize: parsedFileSize || undefined,
      mimeType: mimeType || undefined,
    });

    return NextResponse.json({ document });
  } catch (err) {
    console.error("Document upload failed:", err);
    return NextResponse.json(
      { error: "Unable to save document. Please try again or use a smaller file." },
      { status: 500 }
    );
  }
}
