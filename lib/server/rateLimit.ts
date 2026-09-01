// Lightweight in-memory sliding-window rate limiter. Good enough as a
// first line of defense against casual brute-forcing / email bombing.
//
// Real limitation: this resets on every serverless cold start and isn't
// shared across concurrent instances on Netlify, so a determined attacker
// distributing requests across cold starts isn't meaningfully slowed down.
// A durable fix needs a shared store (e.g. Redis / Upstash) keyed by
// IP+route; that's a bigger infra change than a quick code fix.

const attempts = new Map<string, number[]>();

export function isRateLimited(key: string, maxAttempts: number, windowMs: number): boolean {
  const now = Date.now();
  const timestamps = (attempts.get(key) ?? []).filter((t) => now - t < windowMs);

  if (timestamps.length >= maxAttempts) {
    attempts.set(key, timestamps);
    return true;
  }

  timestamps.push(now);
  attempts.set(key, timestamps);
  return false;
}

export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}
