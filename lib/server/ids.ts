import { NextResponse } from "next/server";

// Matches the UUID shape Postgres accepts (any version/variant hex form).
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

/** Returns a 400 response when the value is not a valid UUID; otherwise null. */
export function invalidUuidResponse(value: unknown, label = "ID") {
  if (isUuid(value)) return null;
  return NextResponse.json({ error: `Invalid ${label}.` }, { status: 400 });
}
