import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/server/guard";
import { createDocument, listProjects } from "@/lib/server/repo";
import { isUuid } from "@/lib/server/ids";
import {
  isDangerousMimeType,
  isAllowedMimeType,
  estimateBase64Size,
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_LABEL,
} from "@/lib/server/fileSafety";

export async function POST(request: Request) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request body." }, { status: 400 });

  const { name, description, projectId, fileName, fileData, fileSize, mimeType } = body;

  if (isDangerousMimeType(mimeType)) {
    return NextResponse.json(
      { error: "This file type isn't allowed for security reasons." },
      { status: 400 }
    );
  }

  if (mimeType && !isAllowedMimeType(mimeType)) {
    return NextResponse.json(
      { error: "This file type is not supported. Please upload a PDF, image, document, spreadsheet, or archive." },
      { status: 400 }
    );
  }

  // Server-side file size check (base64 data URL)
  if (fileData && typeof fileData === "string") {
    const actualSize = estimateBase64Size(fileData);
    if (actualSize > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: `File is too large. Maximum size is ${MAX_FILE_SIZE_LABEL}.` },
        { status: 400 }
      );
    }
  }

  if (!projectId || typeof projectId !== "string") {
    return NextResponse.json({ error: "Every document must be associated with a project." }, { status: 400 });
  }
  if (!isUuid(projectId)) {
    return NextResponse.json({ error: "Invalid project ID." }, { status: 400 });
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
