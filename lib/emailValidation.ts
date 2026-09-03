/**
 * Light email validation — catches typos and common domain misspellings.
 * Not a full RFC 5322 validator, just enough to stop accidental mistakes.
 */

// Common misspellings → correct domain
const DOMAIN_TYPO_MAP: Record<string, string> = {
  "gmial.com": "gmail.com",
  "gmal.com": "gmail.com",
  "gmai.com": "gmail.com",
  "gamil.com": "gmail.com",
  "gmali.com": "gmail.com",
  "gmaill.com": "gmail.com",
  "gnail.com": "gmail.com",
  "gmil.com": "gmail.com",
  "gmail.co": "gmail.com",
  "gmail.con": "gmail.com",
  "gmail.om": "gmail.com",
  "gmail.cm": "gmail.com",
  "gmail.comm": "gmail.com",
  "gmaul.com": "gmail.com",
  "yaho.com": "yahoo.com",
  "yahooo.com": "yahoo.com",
  "yahoo.co": "yahoo.com",
  "yahoo.con": "yahoo.com",
  "hotmal.com": "hotmail.com",
  "hotmai.com": "hotmail.com",
  "hotmail.co": "hotmail.com",
  "hotmail.con": "hotmail.com",
  "outlok.com": "outlook.com",
  "outloo.com": "outlook.com",
  "outlook.co": "outlook.com",
  "outlook.con": "outlook.com",
};

// Suspicious TLDs that are almost always a typo of .com
const SUSPICIOUS_TLDS = [".co", ".con", ".cm", ".om", ".comm"];

export interface EmailCheckResult {
  valid: boolean;
  error?: string;
  suggestion?: string; // e.g. "Did you mean gmail.com?"
}

export function validateEmail(email: string): EmailCheckResult {
  const trimmed = email.trim().toLowerCase();

  // Basic format check
  if (!trimmed) {
    return { valid: false, error: "Email is required." };
  }

  const atIndex = trimmed.indexOf("@");
  if (atIndex < 1 || atIndex !== trimmed.lastIndexOf("@")) {
    return { valid: false, error: "Please enter a valid email address." };
  }

  const [local, domain] = [trimmed.slice(0, atIndex), trimmed.slice(atIndex + 1)];

  if (!local || local.length > 64) {
    return { valid: false, error: "Please enter a valid email address." };
  }

  // Domain must have at least one dot
  if (!domain || !domain.includes(".")) {
    return { valid: false, error: "Please enter a valid email address." };
  }

  // Domain parts check
  const parts = domain.split(".");
  if (parts.some((p) => !p) || parts[parts.length - 1].length < 2) {
    return { valid: false, error: "The email domain looks invalid." };
  }

  // Check for known domain typos
  const corrected = DOMAIN_TYPO_MAP[domain];
  if (corrected) {
    return {
      valid: false,
      error: `Did you mean ${local}@${corrected}?`,
      suggestion: `${local}@${corrected}`,
    };
  }

  // Check suspicious TLD on popular domains
  const domainBase = domain.slice(0, domain.lastIndexOf("."));
  const tld = domain.slice(domain.lastIndexOf("."));
  const popularBases = ["gmail", "yahoo", "hotmail", "outlook", "icloud", "aol"];
  if (popularBases.includes(domainBase) && SUSPICIOUS_TLDS.includes(tld)) {
    const likely = `${domainBase}.com`;
    return {
      valid: false,
      error: `Did you mean ${local}@${likely}?`,
      suggestion: `${local}@${likely}`,
    };
  }

  return { valid: true };
}
