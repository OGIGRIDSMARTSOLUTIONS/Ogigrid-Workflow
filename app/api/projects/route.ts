import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/guard";
import { createProject } from "@/lib/server/repo";

export async function POST(request: Request) {
  const { user, error } = await requireAdmin();
  if (error) return error;

  const body = await request.json().catch(() => null);
  if (!body || !body.name) {
    return NextResponse.json({ error: "Project name is required." }, { status: 400 });
  }

  const project = await createProject(
    {
      name: body.name,
      description: body.description ?? "",
      status: body.status ?? "To Do",
      startDate: body.startDate ?? "",
      deadline: body.deadline ?? "",
      memberIds: Array.isArray(body.memberIds) ? body.memberIds : [],
    },
    user!.id
  );
  return NextResponse.json({ project });
}
