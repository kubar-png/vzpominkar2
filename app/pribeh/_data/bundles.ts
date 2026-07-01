/* Cenové balíčky 1 / 2 / 3 / 5 knih.
 * CENY JSOU PLACEHOLDER — uprav tady na jednom místě. `regular` je přeškrtnutá
 * běžná cena (kotva), `price` akční cena celkem, `perUnit` cena za kus. */

export type Bundle = {
  id: string;
  qty: number;
  name: string;
  desc: string;
  regular: number;
  price: number;
  perUnit: number;
  badge?: string;
  featured?: boolean;
  perks: string[];
  cta: string;
};

export const BUNDLES: Bundle[] = [
  {
    id: "1",
    qty: 1,
    name: "Jedna kniha",
    desc: "Pro jednoho blízkého.",
    regular: 699,
    price: 499,
    perUnit: 499,
    perks: ["300 otázek v 5 kapitolách", "Pevná vazba, ~200 stran", "Dárková krabička v ceně"],
    cta: "Koupit knihu",
  },
  {
    id: "2",
    qty: 2,
    name: "Dvě knihy",
    desc: "Pro oba rodiče nebo prarodiče.",
    regular: 1398,
    price: 898,
    perUnit: 449,
    badge: "Nejoblíbenější",
    featured: true,
    perks: ["Vše z jedné knihy ×2", "Ušetříte 100 Kč", "Doprava zdarma"],
    cta: "Koupit 2 knihy",
  },
  {
    id: "3",
    qty: 3,
    name: "Tři knihy",
    desc: "Pro širší rodinu pohromadě.",
    regular: 2097,
    price: 1197,
    perUnit: 399,
    perks: ["Vše z jedné knihy ×3", "Ušetříte 300 Kč", "Doprava zdarma"],
    cta: "Koupit 3 knihy",
  },
  {
    id: "5",
    qty: 5,
    name: "Pět knih",
    desc: "Pro generace dohromady.",
    regular: 3495,
    price: 1745,
    perUnit: 349,
    perks: ["Vše z jedné knihy ×5", "Nejnižší cena za kus", "Doprava zdarma"],
    cta: "Koupit 5 knih",
  },
];
