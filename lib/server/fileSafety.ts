// mimeType is supplied by the client (the browser File object's reported
// type) and is never independently verified against file bytes. As
// defense in depth alongside the client-side preview allowlist, we reject
// types that can carry and execute script content if ever opened inline —
// text/html and image/svg+xml are the two classic vectors for this.
const DANGEROUS_MIME_TYPES = new Set([
  "text/html",
  "application/xhtml+xml",
  "image/svg+xml",
  "text/javascript",
  "application/javascript",
  "application/x-javascript",
]);

export function isDangerousMimeType(mimeType: unknown): boolean {
  if (typeof mimeType !== "string") return false;
  return DANGEROUS_MIME_TYPES.has(mimeType.toLowerCase().trim());
}
