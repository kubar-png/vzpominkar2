import { NextResponse, type NextRequest } from "next/server";
import { currentUser, hasActiveAccess } from "@/lib/auth/permissions";
import { markGiftPending } from "@/lib/gift/cookie";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

/* ─────────────────────────────────────────────────────────────────────────
 * /darovat/app — entry for the APP gift product when the buyer is ALREADY
 * logged in. Middleware sends logged-in /signup?gift=1 visitors here so they
 * don't dead-end on /dashboard (they came to GIFT the app, not to use it).
 *
 * We set the gift marker cookie (so /onboarding/platba renders the voucher
 * configurator + the order path threads the voucher) and route the owner to
 * the right next step:
 *   - no family yet            → /onboarding (set up the storyteller, then pay)
 *   - family, not yet paid     → /onboarding/platba (configure voucher + pay)
 *   - already has paid access  → /dashboard. Gifting a SECOND app setup means a
 *     new storyteller (the add-senior / další-díl flow), which is its own path
 *     — we don't try to shoehorn it through the first-purchase paywall. Honest:
 *     the buyer already owns the app.
 *
 * A logged-OUT visitor shouldn't reach here (middleware only redirects authed
 * users), but if they do we send them to the normal gift signup.
 * ───────────────────────────────────────────────────────────────────────── */
export async function GET(_req: NextRequest) {
  const user = await currentUser();
  if (!user || user.role !== "owner") {
    return NextResponse.redirect(`${SITE_URL}/signup?gift=1`);
  }

  // Already paid → gifting a further setup is the add-senior flow, not this one.
  if (hasActiveAccess(user)) {
    return NextResponse.redirect(`${SITE_URL}/dashboard`);
  }

  await markGiftPending();

  const next = user.familyId ? "/onboarding/platba" : "/onboarding";
  return NextResponse.redirect(`${SITE_URL}${next}`);
}
