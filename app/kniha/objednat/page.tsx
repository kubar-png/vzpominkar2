import type { Metadata } from "next";
import { canonical } from "@/lib/site";
import { StandardOrder } from "./standard-order";

export const metadata: Metadata = {
  title: "Objednat knihu vzpomínek",
  description:
    "Standardní kniha vzpomínek s doporučenými otázkami napříč šesti životními obdobími. Vyberte, komu knihu věnujete, a pošleme ji na vaši adresu.",
  alternates: { canonical: canonical("/kniha/objednat") },
};

// Standard (599 Kč) gift book — a plain checkout, no question editor. The custom
// book lives in the configurator (/kniha/sestavit). The .editorial class keeps the
// editorial color tokens the .kc styles use. Price read from env (display only;
// the server stays authoritative via priceForProductCzk("shop_book_standard")).
// `|| 599` so an unset/0 env (free-path dev/preview) still shows the real price.
const PRICE_STANDARD = Number(process.env.PRICE_SHOP_BOOK_STANDARD_CZK) || 599;

export default function ObjednatPage() {
  return (
    <div className="editorial">
      <StandardOrder basePriceCzk={PRICE_STANDARD} />
    </div>
  );
}
