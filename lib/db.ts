import { Pool } from "pg";

// Reuse a single connection pool across hot reloads in dev (Next.js
// re-evaluates modules on every change, which would otherwise open a new
// pool per reload and exhaust Postgres connections).
declare global {
  // eslint-disable-next-line no-var
  var __pgPool: Pool | undefined;
}

// Supabase (and most hosted Postgres providers) require SSL; local
// Postgres does not use it. Detect "local" by hostname so this file works
// unchanged against either DATABASE_URL.
const isLocalDb = /localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL ?? "");

export const pool =
  global.__pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: isLocalDb ? undefined : { rejectUnauthorized: false },
  });

if (process.env.NODE_ENV !== "production") {
  global.__pgPool = pool;
}

export async function query<T = any>(
  text: string,
  params: any[] = [],
): Promise<T[]> {
  const result = await pool.query(text, params);
  return result.rows as T[];
}

export async function queryOne<T = any>(
  text: string,
  params: any[] = [],
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}
