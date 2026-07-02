/* Site-level config for the /pribeh standalone landing.
 * Brand is a PLACEHOLDER — swap name/mark here once branding is decided. */

export const BRAND = {
  name: "Vzpomínkář",
  mark: "✦",
};

/* Rotating announcement-bar messages. `<b>…</b>` is rendered as emphasis. */
export const ANNOUNCEMENTS: string[] = [
  "Doprava <b>zdarma</b> po celé ČR",
  "Právě v <b>testovací verzi</b> — vyzkoušejte zdarma",
  "Tištěno a vázáno v <b>České republice</b>",
];

/* Top navigation — mirrors a typical book e-shop. Links point to on-page
 * anchors for now; wire to real routes once the shop exists. */
export const NAV_LINKS: { label: string; href: string }[] = [
  { label: "Obchod", href: "#balicky" },
  { label: "Kniha", href: "#detail" },
  { label: "Jak to funguje", href: "#jak" },
  { label: "Recenze", href: "#recenze" },
  { label: "Časté dotazy", href: "#faq" },
  { label: "O nás", href: "#" },
];

export const FOOTER_COLS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Nákup",
    links: [
      { label: "Kniha vzpomínek", href: "#detail" },
      { label: "Cenové balíčky", href: "#balicky" },
      { label: "Vlastní otázky", href: "#detail" },
      { label: "Dárkový poukaz", href: "#" },
    ],
  },
  {
    title: "Informace",
    links: [
      { label: "Jak to funguje", href: "#jak" },
      { label: "Doprava a platba", href: "#faq" },
      { label: "Časté dotazy", href: "#faq" },
      { label: "Recenze", href: "#recenze" },
    ],
  },
  {
    title: "O nás",
    links: [
      { label: "Náš příběh", href: "#" },
      { label: "Kontakt", href: "mailto:ahoj@vzpominkar.com" },
      { label: "Novinky", href: "#" },
      { label: "Pro firmy", href: "#" },
    ],
  },
  {
    title: "Podpora",
    links: [
      { label: "Sledování objednávky", href: "#" },
      { label: "Vrácení a reklamace", href: "#faq" },
      { label: "Obchodní podmínky", href: "/podminky" },
      { label: "Ochrana údajů", href: "/soukromi" },
    ],
  },
];

export const PAYMENTS = ["VISA", "MC", "Apple Pay", "Google Pay", "Převod"];

export const SOCIALS: { label: string; href: string; icon: "facebook" | "instagram" }[] = [
  { label: "Facebook", href: "#", icon: "facebook" },
  { label: "Instagram", href: "#", icon: "instagram" },
];
