/* "Jak to funguje" — 4 kroky. icon = klíč do Icon komponenty. */

export type Step = { n: number; icon: string; title: string; text: string };

export const STEPS: Step[] = [
  {
    n: 1,
    icon: "book",
    title: "Vyberte knihu",
    text: "Klasická s 300 připravenými otázkami, nebo verze, do které přidáte vlastní otázky na míru.",
  },
  {
    n: 2,
    icon: "gift",
    title: "Darujte blízkému",
    text: "Přijde v dárkové krabičce. Stačí předat — žádné aplikace, žádné přihlašování.",
  },
  {
    n: 3,
    icon: "pen",
    title: "Blízký vyplní otázky",
    text: "Vlastním tempem a vlastní rukou. Kdo nerad píše, odpoví hlasem přes QR kód v knize.",
  },
  {
    n: 4,
    icon: "infinity",
    title: "Zůstane navždy",
    text: "Z vyplněné knihy se stane rodinný poklad, ke kterému se budete vracet celé generace.",
  },
];
