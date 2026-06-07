"use server";

import "server-only";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { verifyAdminCredentials, ADMIN_COOKIE, ADMIN_SESSION_MAX_AGE } from "@/lib/admin/auth";
import { signAdminSession } from "@/lib/admin/session";
import { checkRateLimit, checkAdminUsernameLimit, rateLimitMessage } from "@/lib/rate-limit";

/**
 * Admin login/logout Server Actions. This surface is 100% separate from the
 * Supabase/user auth flow in `lib/auth/actions.ts` — it never touches Supabase
 * and the credential lives only in env (see `lib/admin/auth.ts`). There is no
 * signup, reset, or account-creation action here by design.
 */

export type AdminActionResult = { ok: false; error: string };

/** Single generic error — never reveals whether the username or password was wrong. */
const GENERIC_ERROR = "Nesprávné přihlašovací údaje.";

export async function loginAdmin(
  _prev: AdminActionResult | null,
  formData: FormData,
): Promise<AdminActionResult> {
  // Per-IP ceiling (fails CLOSED in prod via authFailDecision).
  const rl = await checkRateLimit("admin", "login");
  if (!rl.ok) return { ok: false, error: rateLimitMessage(rl.retryAfterSec) };

  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");

  // Per-username ceiling so a rotating-IP attacker can't hammer the one known
  // account past the per-IP limit. Keyed on the submitted value.
  const userRl = await checkAdminUsernameLimit(username);
  if (!userRl.ok) return { ok: false, error: rateLimitMessage(userRl.retryAfterSec) };

  if (!verifyAdminCredentials(username, password)) {
    return { ok: false, error: GENERIC_ERROR };
  }

  const token = await signAdminSession();
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/admin",
    maxAge: ADMIN_SESSION_MAX_AGE,
  });

  redirect("/admin");
}

export async function logoutAdmin(): Promise<void> {
  const cookieStore = await cookies();
  // Delete with the same path the cookie was set on, else the browser keeps it.
  cookieStore.set(ADMIN_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/admin",
    maxAge: 0,
  });
  redirect("/admin/login");
}
