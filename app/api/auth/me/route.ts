import { NextResponse } from "next/server";
import { getSessionEmployee } from "@/lib/server/session";
import { countEmployees } from "@/lib/server/repo";

export async function GET() {
  const user = await getSessionEmployee();
  const workspaceHasUsers = (await countEmployees()) > 0;
  return NextResponse.json({ user, workspaceHasUsers });
}
