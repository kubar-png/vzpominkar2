import { NextResponse, type NextRequest } from "next/server";
import { signInSeniorByMagicToken } from "@/lib/auth/senior-magic";
import { checkRateLimitWithHeaders } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Senior magic link — /q/{token}.
 *
 * The weekly reminder email links here. Clicking it signs the senior in (no
 * username/password) and lands them on this week's question, removing the
 * biggest friction for an elderly storyteller. Tokens are stable, high-entropy
 * and domain-independent: switching to the live domain only changes the URL
 * prefix (built from SITE_URL), never the token, so already-printed/sent links
 * stay valid once the prefix matches.
 */
export async function GET(req: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const origin = new URL(req.url).origin;

  // Light per-IP throttle. Tokens are unguessable (32 bytes), so this isn't the
  // primary defence — it just caps abuse of the admin generateLink path. Fail-OPEN
  // (a senior must never be locked out of answering).
  const rl = await checkRateLimitWithHeaders("magic", req.headers);
  if (!rl.ok) {
    return NextResponse.redirect(new URL("/senior-login?odkaz=limit", origin));
  }

  const result = await signInSeniorByMagicToken(token);
  if (!result.ok) {
    // Don't reveal whether the token existed — both invalid and failed land here.
    return NextResponse.redirect(new URL("/senior-login?odkaz=neplatny", origin));
  }

  return NextResponse.redirect(new URL("/home", origin));
}
