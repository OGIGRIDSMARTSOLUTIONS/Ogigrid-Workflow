/**
 * Shared password policy for signup, admin-created accounts, reset, and change password.
 * Special characters are allowed but not required.
 */

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

export const PASSWORD_POLICY_MESSAGE =
  "Password must be 8+ characters and include uppercase, lowercase, and a number. Special characters are optional.";

export const PASSWORD_HINT =
  "8+ characters, with uppercase, lowercase, and a number. Special characters optional.";

export function validatePassword(password: unknown): { valid: boolean; error?: string } {
  if (typeof password !== "string" || !password) {
    return { valid: false, error: PASSWORD_POLICY_MESSAGE };
  }
  if (password.length < PASSWORD_MIN_LENGTH || password.length > PASSWORD_MAX_LENGTH) {
    return { valid: false, error: PASSWORD_POLICY_MESSAGE };
  }
  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
    return { valid: false, error: PASSWORD_POLICY_MESSAGE };
  }
  return { valid: true };
}
