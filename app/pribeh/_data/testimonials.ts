/* Recenze — PLACEHOLDER obsah. Nahraď reálnými ohlasy po spuštění.
 * (Před spuštěním nepoužívat jako pravdivé recenze.) */

export type Review = { name: string; role: string; rating: number; quote: string };

export const REVIEWS: Review[] = [
  {
    name: "Jana K.",
    role: "darovala mamince",
    rating: 5,
    quote:
      "Mamka knihu vyplňovala celé Vánoce a my jsme se u toho dozvěděli věci, které jsme za třicet let neslyšeli. Nejlepší dárek, co jsme kdy dali.",
  },
  {
    name: "Petr H.",
    role: "daroval tátovi",
    rating: 5,
    quote:
      "Táta moc nemluví o pocitech, ale do knihy napsal věci, které by nahlas nikdy neřekl. Mám to teď černé na bílém, jeho rukou.",
  },
  {
    name: "Lucie M.",
    role: "darovala babičce",
    rating: 5,
    quote:
      "Babička nahrávala odpovědi hlasem přes QR kód. Když si je teď pustím, je to, jako by byla pořád s námi. Neskutečná věc.",
  },
  {
    name: "Tomáš R.",
    role: "vlastní otázky",
    rating: 5,
    quote:
      "Přidal jsem dědovi vlastní otázky o našem rodném kraji a o babičce. Bylo vidět, že ho to potěšilo — odpovídal nejradši zrovna na ně.",
  },
  {
    name: "Eva S.",
    role: "darovala rodičům",
    rating: 5,
    quote:
      "Objednávka i doručení bez problému, kniha je krásně vázaná a papír příjemný na psaní. Rodiče byli dojatí už z té krabičky.",
  },
  {
    name: "Martin D.",
    role: "daroval k výročí",
    rating: 5,
    quote:
      "Dali jsme ji rodičům k padesátinám svatby. Vyplňovali ji spolu u stolu a vzpomínali — a my u toho měli oči na mokrém místě.",
  },
];
