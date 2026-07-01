import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Barevné varianty — /pribeh",
  robots: { index: false, follow: false },
};

type Palette = {
  id: string;
  name: string;
  mood: string;
  bg: string;
  bg2: string;
  primary: string;
  cta: string;
  accent: string;
  text: string;
  line: string;
};

const PALETTES: Palette[] = [
  {
    id: "svestka",
    name: "1 · Švestková & starorůžová",
    mood: "emocionální, jemné — ke keepsake/dárku",
    bg: "#f5f0f4", bg2: "#ece3ec", primary: "#3c2a4a", cta: "#c46d86",
    accent: "#c98a2b", text: "#2b2630", line: "#e4d6e0",
  },
  {
    id: "salvej",
    name: "2 · Šalvějová & hliněná",
    mood: "přírodní, klidné, organické",
    bg: "#f3f1e7", bg2: "#e8e6d4", primary: "#33493f", cta: "#cf7a54",
    accent: "#c2922f", text: "#232a24", line: "#dfdcc6",
  },
  {
    id: "bordo",
    name: "3 · Bordó & krémová",
    mood: "bohaté, nadčasové, dědictví",
    bg: "#f6efe3", bg2: "#ecdfca", primary: "#5a2230", cta: "#b5462f",
    accent: "#c2912f", text: "#2a1d1c", line: "#e6d6bd",
  },
  {
    id: "inkoust",
    name: "4 · Inkoust & hořčicová",
    mood: "redakční, moderní, vysoký kontrast",
    bg: "#f7f4ee", bg2: "#ece6d8", primary: "#23211c", cta: "#d39a2e",
    accent: "#b5532b", text: "#2a2722", line: "#e3dcc9",
  },
];

const SWATCHES: { key: keyof Palette; label: string }[] = [
  { key: "bg", label: "Pozadí" },
  { key: "primary", label: "Primární" },
  { key: "cta", label: "CTA" },
  { key: "accent", label: "Akcent" },
  { key: "text", label: "Text" },
];

function Star({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" width={16} height={16} fill={color} aria-hidden="true">
      <path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 18.9 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9z" />
    </svg>
  );
}

function Card({ p }: { p: Palette }) {
  return (
    <div style={{ background: "#211d1a", borderRadius: 18, overflow: "hidden", border: "1px solid #322b25" }}>
      {/* header */}
      <div style={{ padding: "16px 18px 12px" }}>
        <div style={{ color: "#f3ede4", fontFamily: "var(--pl-fraunces), Georgia, serif", fontSize: 18, fontWeight: 600 }}>{p.name}</div>
        <div style={{ color: "#a89c8d", fontSize: 12.5, marginTop: 2 }}>{p.mood}</div>
      </div>

      {/* swatches */}
      <div style={{ display: "flex", gap: 6, padding: "0 18px 14px" }}>
        {SWATCHES.map((s) => (
          <div key={s.key} style={{ flex: 1, minWidth: 0 }}>
            <div style={{ height: 40, borderRadius: 8, background: p[s.key], border: "1px solid rgba(255,255,255,.12)" }} />
            <div style={{ color: "#cabfae", fontSize: 10.5, marginTop: 5, fontWeight: 600 }}>{s.label}</div>
            <div style={{ color: "#7d7264", fontSize: 10, fontVariantNumeric: "tabular-nums" }}>{p[s.key]}</div>
          </div>
        ))}
      </div>

      {/* live text sample on the palette bg */}
      <div style={{ background: p.bg, padding: "26px 24px 28px", color: p.text, fontFamily: "var(--pl-hanken), system-ui, sans-serif" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 7, color: p.cta, fontWeight: 700, fontSize: 11.5, letterSpacing: ".14em", textTransform: "uppercase" }}>
          <span style={{ color: p.accent }}>✦</span> Kniha plná otázek
        </div>
        <h2 style={{ margin: "12px 0 0", fontFamily: "var(--pl-fraunces), Georgia, serif", fontWeight: 600, fontSize: 30, lineHeight: 1.08, letterSpacing: "-.015em", color: p.primary }}>
          Chci znát celý{" "}
          <span style={{ position: "relative", whiteSpace: "nowrap", color: p.cta }}>
            tvůj příběh
            <span style={{ display: "block", height: 3, borderRadius: 2, background: p.accent, marginTop: 2, width: "100%" }} />
          </span>
        </h2>
        <p style={{ margin: "14px 0 0", fontSize: 15, lineHeight: 1.55, color: p.text, opacity: 0.86, maxWidth: 380 }}>
          Konečně dárek, na který nezapomenou. Vázaná kniha s 300 otázkami, kterou darujete blízkému — a on ji vlastními slovy promění v rodinný příběh.
        </p>

        <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 20, flexWrap: "wrap" }}>
          <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", background: p.cta, color: "#fff", fontWeight: 700, fontSize: 14.5, padding: "12px 22px", borderRadius: 999 }}>
            Koupit knihu
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: p.primary, fontWeight: 600, fontSize: 14.5 }}>
            Jak to funguje →
          </span>
        </div>

        {/* secondary surfaces: card on bg2 + price + stars */}
        <div style={{ display: "flex", gap: 12, marginTop: 22, alignItems: "stretch", flexWrap: "wrap" }}>
          <div style={{ background: p.bg2, border: `1px solid ${p.line}`, borderRadius: 14, padding: "14px 16px", flex: "1 1 180px" }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: p.accent }}>Nejoblíbenější</div>
            <div style={{ fontFamily: "var(--pl-fraunces), serif", fontWeight: 600, fontSize: 26, color: p.text, marginTop: 4 }}>
              898 Kč <span style={{ fontSize: 13, color: p.text, opacity: 0.5, textDecoration: "line-through", fontFamily: "var(--pl-hanken)" }}>1 398 Kč</span>
            </div>
            <div style={{ color: p.cta, fontWeight: 700, fontSize: 12.5, marginTop: 2 }}>449 Kč / kniha</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 4 }}>
            <span style={{ display: "inline-flex", gap: 2 }}>
              {Array.from({ length: 5 }).map((_, i) => <Star key={i} color={p.accent} />)}
            </span>
            <span style={{ fontSize: 12.5, color: p.text, opacity: 0.7 }}>4,9 z 5</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BarvyPage() {
  return (
    <div style={{ background: "#15120f", minHeight: "100vh", padding: "40px clamp(16px,4vw,40px) 80px" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <h1 style={{ color: "#f3ede4", fontFamily: "var(--pl-fraunces), Georgia, serif", fontWeight: 600, fontSize: 30, letterSpacing: "-.01em" }}>
          Barevné varianty landingu
        </h1>
        <p style={{ color: "#a89c8d", fontSize: 14.5, marginTop: 8, maxWidth: 640, lineHeight: 1.6 }}>
          4 sladěné palety jako vzorky + ukázka, jak na nich vypadá nadpis, text, tlačítko, cena a hvězdy.
          Řekni číslo, které chceš, a aplikuju ho na celý landing <code style={{ color: "#e0a06a" }}>/pribeh</code>.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 22, marginTop: 30 }} className="pl-barvy-grid">
          {PALETTES.map((p) => <Card key={p.id} p={p} />)}
        </div>
      </div>
      <style>{`@media (max-width: 760px){ .pl-barvy-grid{ grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}
