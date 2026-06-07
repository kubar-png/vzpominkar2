import type { Metadata } from "next";
import { canonical } from "@/lib/site";
import { priceForProductCzk, assertDisplayPriceMatchesCharged } from "@/lib/stripe/server";
import { StandardOrder } from "./standard-order";

export const metadata: Metadata = {
  title: "Objednat knihu vzpomínek",
  description:
    "Standardní kniha vzpomínek s doporučenými otázkami napříč šesti životními obdobími. Vyberte, komu knihu věnujete, a pošleme ji na vaši adresu.",
  alternates: { canonical: canonical("/kniha/objednat") },
};

// Standard gift book — a plain checkout, no question editor. The custom book
// lives in the configurator (/kniha/sestavit). The .editorial class keeps the
// editorial color tokens the .kc styles use.
//
// The displayed base price is the SAME value the server charges — we read it
// through priceForProductCzk("shop_book_standard") (no `|| 599` floor), so a
// genuinely free order (env 0 → server takes the free path) truthfully shows
// "0 Kč" next to an "Objednat knihu" CTA instead of trapping the buyer with a
// 599 Kč price they'd never be charged. When the env IS configured, the real
// price flows through unchanged.

export default function ObjednatPage() {
  // Charged === displayed on this screen (unlike /onboarding/platba, which has a
  // sanctioned free-path trust price). The guard catches any future drift where
  // a non-zero price would be shown next to a free-path order.
  const basePriceCzk = priceForProductCzk("shop_book_standard");
  assertDisplayPriceMatchesCharged(basePriceCzk, basePriceCzk, "kniha/objednat shop_book_standard");

  return (
    <div className="editorial">
      <StandardOrder basePriceCzk={basePriceCzk} />
    </div>
  );
}
