import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/guard";
import { createDocument } from "@/lib/server/repo";

export async function POST(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await request.json().catch(() => null);
  if (!body || !body.name) {
    return NextResponse.json({ error: "Document name is required." }, { status: 400 });
  }

  const document = await createDocument({
    name: body.name,
    description: body.description ?? "",
    projectId: body.projectId || null,
  });
  return NextResponse.json({ document });
}
