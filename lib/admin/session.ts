import "server-only";
import { ADMIN_SESSION_MAX_AGE } from "@/lib/admin/constants";

/**
 * Admin session cookie — signed with HMAC-SHA256 via the Web Crypto API
 * (`crypto.subtle`) so the SAME verification runs in middleware (Edge runtime)
 * and in the server layout. No Node `crypto` here.
 *
 * Token format: `base64url(JSON payload)` + "." + `base64url(HMAC of that payload string)`.
 * Payload: `{ exp: <unix seconds> }`. There is no user id or role — the mere
 * presence of a validly-signed, unexpired token IS the admin grant (single
 * operator). The signing key is `ADMIN_SESSION_SECRET` (env only).
 */

const ENCODER = new TextEncoder();

function base64urlEncode(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlDecode(str: string): Uint8Array {
  const pad = str.length % 4 === 0 ? "" : "=".repeat(4 - (str.length % 4));
  const bin = atob(str.replace(/-/g, "+").replace(/_/g, "/") + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function importKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    ENCODER.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

async function hmac(secret: string, message: string): Promise<Uint8Array> {
  const key = await importKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, ENCODER.encode(message));
  return new Uint8Array(sig);
}

/** Constant-time byte compare (length-independent of where bytes differ). */
function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i]! ^ b[i]!;
  return diff === 0;
}

/**
 * Sign a fresh admin session token.
 *
 * @param nowSec  Current time in unix seconds. Defaults to `Date.now()`; passed
 *                explicitly in tests for determinism.
 * @param maxAge  Token lifetime in seconds. Defaults to `ADMIN_SESSION_MAX_AGE`.
 */
export async function signAdminSession(
  nowSec: number = Math.floor(Date.now() / 1000),
  maxAge: number = ADMIN_SESSION_MAX_AGE,
): Promise<string> {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error("ADMIN_SESSION_SECRET is not set");
  const payloadJson = JSON.stringify({ exp: nowSec + maxAge });
  const payloadB64 = base64urlEncode(ENCODER.encode(payloadJson));
  const sig = await hmac(secret, payloadB64);
  return `${payloadB64}.${base64urlEncode(sig)}`;
}

/**
 * Verify an admin session token: recompute the HMAC over the payload segment,
 * constant-time compare the signature, then check `exp > now`. Returns false on
 * any malformed token, bad signature, expiry, or missing secret (fails closed).
 *
 * @param nowSec  Current time in unix seconds. Defaults to `Date.now()`; passed
 *                explicitly in tests for determinism.
 */
export async function verifyAdminSession(
  token: string | undefined | null,
  nowSec: number = Math.floor(Date.now() / 1000),
): Promise<boolean> {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || !token) return false;

  const dot = token.indexOf(".");
  if (dot <= 0 || dot === token.length - 1) return false;
  const payloadB64 = token.slice(0, dot);
  const sigB64 = token.slice(dot + 1);
  if (token.indexOf(".", dot + 1) !== -1) return false; // exactly one separator

  let providedSig: Uint8Array;
  try {
    providedSig = base64urlDecode(sigB64);
  } catch {
    return false;
  }

  const expectedSig = await hmac(secret, payloadB64);
  if (!constantTimeEqual(providedSig, expectedSig)) return false;

  // Signature is valid → the payload is trustworthy; now decode & check expiry.
  let exp: unknown;
  try {
    const json = new TextDecoder().decode(base64urlDecode(payloadB64));
    exp = (JSON.parse(json) as { exp?: unknown }).exp;
  } catch {
    return false;
  }
  if (typeof exp !== "number" || !Number.isFinite(exp)) return false;
  return exp > nowSec;
}
