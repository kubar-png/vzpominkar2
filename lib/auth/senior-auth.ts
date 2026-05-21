import "server-only";

/**
 * Senior accounts can't use email login (per spec - seniors don't manage
 * emails). Internally we synthesize a deterministic per-account email so
 * we can use Supabase Auth's standard signInWithPassword flow.
 *
 * The synth address is never shown to the user, never used for delivery,
 * and ignored by the email column on profiles (which is owner-only).
 */
const SYNTH_DOMAIN = "vzpominkar.internal";

/** Build a synth email for a fresh senior account from a uuid. */
export function buildSeniorEmail(uuid: string): string {
  return `senior-${uuid}@${SYNTH_DOMAIN}`;
}

export function isSyntheticEmail(email: string | null | undefined): boolean {
  return !!email && email.endsWith(`@${SYNTH_DOMAIN}`);
}

/**
 * Username validation rules:
 * - 3-32 chars
 * - lowercase ASCII letters, digits, underscore, dot, dash
 * - must start with a letter
 * Czech diacritics are intentionally rejected - usernames need to be easy
 * to type without IME, written down, and dictated over the phone.
 */
const USERNAME_RE = /^[a-z][a-z0-9_.-]{2,31}$/;

export function isValidUsername(username: string): boolean {
  return USERNAME_RE.test(username);
}

export function normalizeUsername(input: string): string {
  return input.trim().toLowerCase();
}
