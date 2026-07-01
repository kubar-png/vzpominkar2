/* "Co kniha obsahuje" — střídavé řádky (obrázek / text) + ukázková otázka. */

export const CHAPTERS: string[] = [
  "Dětství",
  "Mládí a školní léta",
  "Láska a rodina",
  "Práce a životní cesta",
  "Moudrost a dnešek",
];

export const SAMPLE = {
  chapter: "Dětství · otázka 12",
  q: "Co u vás doma bývalo na nedělní oběd — a kdo ho vařil?",
  a: "Skoro vždycky svíčková. Mamka vstávala v sedm, aby stihla těsto na knedlíky…",
};

export type Feature = {
  eyebrow: string;
  title: string;
  body: string;
  reverse?: boolean;
  /** "sample" vykreslí ukázkovou kartu otázky; "chapters" přidá čipy kapitol */
  variant?: "sample" | "chapters" | "photo";
  mediaLabel?: string;
  mediaDim?: string;
};

export const FEATURES: Feature[] = [
  {
    eyebrow: "Otázky",
    title: "300 otázek, které rozpovídají",
    body: "Žádné formuláře ani jednoslovné kolonky. Každá otázka je napsaná tak, aby vyvolala vzpomínku a chuť vyprávět — od první školní lavice po radu, kterou stojí za to předat dál.",
    variant: "sample",
  },
  {
    eyebrow: "Struktura",
    title: "Pět kapitol — celý život v jedné knize",
    body: "Otázky vedou chronologicky napříč životem, takže se vyplňování nikdy nezasekne. Stačí jít kapitolu po kapitole, jednu odpověď u kávy.",
    variant: "chapters",
    reverse: true,
    mediaLabel: "Foto: rozevřená kniha",
    mediaDim: "1200 × 900",
  },
  {
    eyebrow: "Hlas",
    title: "Když psaní nestačí, kniha promluví",
    body: "U vybraných otázek může blízký odpověď jednoduše namluvit. Nahrávka se propojí s QR kódem vytištěným v knize — kdokoli ho naskenuje telefonem, uslyší jejich skutečný hlas. Bez přihlašování.",
    variant: "photo",
    mediaLabel: "Foto: QR kód v knize + telefon",
    mediaDim: "1200 × 900",
  },
  {
    eyebrow: "Provedení",
    title: "Pevná vazba, krémový papír, dárková krabička",
    body: "Formát A5, šitá pevná vazba a příjemný krémový papír, na který se dobře píše perem. Dorazí v dárkové krabičce, připravená k předání. Tištěno a vázáno v České republice.",
    variant: "photo",
    reverse: true,
    mediaLabel: "Foto: kniha v dárkové krabičce",
    mediaDim: "1200 × 900",
  },
];
