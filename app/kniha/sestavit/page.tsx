import type { Metadata } from "next";
import Link from "next/link";
import { Shell } from "@/components/landing/Shell";

export const metadata: Metadata = {
  title: "Sestavit vlastní knihu",
  robots: { index: false },
};

/* Placeholder — the question configurator (cesta B) ships in the next phase.
 * Keeps the /kniha CTAs from 404-ing while the wizard + order flow are built. */
export default function SestavitPage() {
  return (
    <Shell>
      <section className="hero">
        <div className="container">
          <span className="eyebrow">Sestavit vlastní knihu</span>
          <h1 style={{ maxWidth: "20ch", margin: "0 auto 24px" }}>
            Konfigurátor právě dokončujeme.
          </h1>
          <p className="lede">
            Tady si brzy projdete šest životních období a otázky v knize si
            přidáte, odeberete nebo přepíšete — a rovnou objednáte. Pracujeme na
            tom.
          </p>
          <Link href="/kniha" className="btn btn-gold">
            Zpět na knihu <span className="arrow">↗</span>
          </Link>
        </div>
      </section>
    </Shell>
  );
}
