import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireOwner, hasActiveAccess } from "@/lib/auth/permissions";
import { startBaseCheckout } from "@/lib/stripe/checkout";
import { signOut } from "@/lib/auth/actions";

export const metadata: Metadata = { title: "Přístup ke knize" };

/**
 * Access / activation page. Deliberately OUTSIDE the (app) route group so an
 * un-paid owner can reach it — the (app) layout's requireActiveOwner gate
 * redirects families without paid access here. Uses plain requireOwner so it
 * never redirect-loops.
 *
 * One-time, lifetime model. While the price is 0 CZK the button activates
 * instantly (free path in purchaseBook) and bounces to the dashboard; once a
 * real price is configured the same button opens Stripe Checkout.
 */
export default async function SubscriptionPage() {
  const owner = await requireOwner();
  if (!owner.familyId) redirect("/onboarding");

  const active = hasActiveAccess(owner);

  return (
    <div className="editorial">
      <section className="auth-shell">
        <div className="auth-card" style={{ textAlign: "center" }}>
          <span
            className="auth-eyebrow"
            style={{ justifyContent: "center", display: "inline-flex" }}
          >
            Přístup ke knize
          </span>

          {active ? (
            <>
              <h1 className="auth-title">Váš přístup je aktivní.</h1>
              <p className="auth-lede">
                Máte zaplacený přístup k Vzpomínkáři — napořád.
              </p>
              <div className="auth-meta" style={{ textAlign: "center" }}>
                <Link href="/dashboard" className="btn btn-gold">
                  Zpět do aplikace <span className="arrow">↗</span>
                </Link>
              </div>
            </>
          ) : (
            <>
              <h1 className="auth-title">Aktivujte přístup.</h1>
              <p className="auth-lede">
                Pro sbírání vzpomínek a tvorbu knihy je potřeba jednorázově
                aktivovat přístup. Zaplatíte jednou a kniha je vaše napořád.
              </p>
              <form action={startBaseCheckout} style={{ marginTop: "8px" }}>
                <button type="submit" className="btn btn-gold">
                  Aktivovat přístup <span className="arrow">↗</span>
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
