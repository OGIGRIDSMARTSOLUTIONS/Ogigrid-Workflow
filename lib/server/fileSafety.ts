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

// Maximum file size: 10 MB
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
export const MAX_FILE_SIZE_LABEL = "10 MB";

// Allowed MIME type prefixes and exact types for uploads
const ALLOWED_MIME_PREFIXES = [
  "image/",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument",
  "application/vnd.ms-excel",
  "application/vnd.ms-powerpoint",
  "application/vnd.oasis.opendocument",
  "text/plain",
  "text/csv",
  "application/zip",
  "application/x-zip-compressed",
  "application/vnd.rar",
  "application/x-rar-compressed",
];

export function isAllowedMimeType(mimeType: unknown): boolean {
  if (typeof mimeType !== "string" || !mimeType.trim()) return false;
  const lower = mimeType.toLowerCase().trim();
  if (isDangerousMimeType(lower)) return false;
  return ALLOWED_MIME_PREFIXES.some((prefix) => lower.startsWith(prefix));
}

/** Estimate actual file size from a base64 data URL string. */
export function estimateBase64Size(dataUrl: string): number {
  // data:mime;base64,<payload>
  const commaIdx = dataUrl.indexOf(",");
  if (commaIdx === -1) return dataUrl.length;
  const base64 = dataUrl.slice(commaIdx + 1);
  const padding = (base64.match(/=+$/) || [""])[0].length;
  return Math.floor((base64.length * 3) / 4) - padding;
}
