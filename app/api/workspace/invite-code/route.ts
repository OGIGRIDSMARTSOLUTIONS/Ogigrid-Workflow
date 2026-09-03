import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/guard";
import { getWorkspaceSetting, setWorkspaceSetting } from "@/lib/server/repo";

// GET — admin retrieves the current invite code
export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const code = await getWorkspaceSetting("invite_code");
  return NextResponse.json({ inviteCode: code });
}

// PATCH — admin updates the invite code
export async function PATCH(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request body." }, { status: 400 });

  const code = (typeof body.inviteCode === "string" ? body.inviteCode : "").trim();
  if (!code) {
    return NextResponse.json({ error: "Invite code cannot be empty." }, { status: 400 });
  }
  if (code.length < 4) {
    return NextResponse.json({ error: "Invite code must be at least 4 characters." }, { status: 400 });
  }

  await setWorkspaceSetting("invite_code", code);
  return NextResponse.json({ inviteCode: code });
}
