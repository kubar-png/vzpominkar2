import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireOwner, hasActiveAccess } from "@/lib/auth/permissions";
import { startYearlyCheckout } from "@/lib/stripe/checkout";
import { signOut } from "@/lib/auth/actions";

export const metadata: Metadata = { title: "Předplatné" };

/**
 * Subscription / renewal page. Deliberately OUTSIDE the (app) route group so
 * it's reachable by a lapsed owner — the (app) layout's requireActiveOwner
 * gate redirects expired families here. Uses plain requireOwner so it never
 * redirect-loops.
 *
 * While the price is 0 CZK the renew button reactivates instantly (free path
 * in createCheckout) and bounces back to the dashboard; once a real price is
 * configured the same button opens Stripe Checkout.
 */
export default async function SubscriptionPage() {
  const owner = await requireOwner();
  if (!owner.familyId) redirect("/onboarding");

  const active = hasActiveAccess(owner);
  const lapsed =
    owner.subscriptionStatus === "expired" || owner.subscriptionStatus === "cancelled";
  const cancelled = owner.subscriptionStatus === "cancelled";
  const expiry = owner.subscriptionExpiresAt
    ? new Date(owner.subscriptionExpiresAt).toLocaleDateString("cs-CZ", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="editorial">
      <section className="auth-shell">
        <div className="auth-card" style={{ textAlign: "center" }}>
          <span
            className="auth-eyebrow"
            style={{ justifyContent: "center", display: "inline-flex" }}
          >
            Předplatné
          </span>

          {active ? (
            <>
              <h1 className="auth-title">Váš přístup je aktivní.</h1>
              <p className="auth-lede">
                {expiry
                  ? `Roční přístup máte zaplacený do ${expiry}.`
                  : "Máte aktivní přístup k Vzpomínkáři."}
              </p>
              <div className="auth-meta" style={{ textAlign: "center" }}>
                <Link href="/dashboard" className="btn btn-gold">
                  Zpět do aplikace <span className="arrow">↗</span>
                </Link>
              </div>
            </>
          ) : lapsed ? (
            <>
              <h1 className="auth-title">
                {cancelled ? "Přístup byl zrušen." : "Váš přístup vypršel."}
              </h1>
              <p className="auth-lede">
                {expiry
                  ? `Platnost skončila ${expiry}. Obnovte roční přístup a pokračujte ve sbírání vzpomínek — vaše dosavadní kniha zůstává zachována.`
                  : "Obnovte roční přístup a pokračujte ve sbírání vzpomínek — vaše dosavadní kniha zůstává zachována."}
              </p>
              <form action={startYearlyCheckout} style={{ marginTop: "8px" }}>
                <button type="submit" className="btn btn-gold">
                  Obnovit roční přístup <span className="arrow">↗</span>
                </button>
              </form>
            </>
          ) : (
            <>
              <h1 className="auth-title">Aktivujte přístup.</h1>
              <p className="auth-lede">
                Pro sbírání vzpomínek a tvorbu knihy je potřeba roční přístup.
                Aktivujte ho a můžete rovnou začít.
              </p>
              <form action={startYearlyCheckout} style={{ marginTop: "8px" }}>
                <button type="submit" className="btn btn-gold">
                  Aktivovat roční přístup <span className="arrow">↗</span>
                </button>
              </form>
            </>
          )}

          <div className="auth-fleuron" aria-hidden>
            <span>⁂</span>
          </div>

          <form action={signOut} className="auth-meta" style={{ textAlign: "center" }}>
            <button type="submit" className="auth-back">
              Odhlásit se
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
