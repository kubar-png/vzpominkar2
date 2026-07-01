/* "Ideální dárek na" — příležitosti. icon = klíč do Icon komponenty. */

export type UseCase = { icon: string; title: string; text: string };

export const USE_CASES: UseCase[] = [
  {
    icon: "gift",
    title: "Vánoce",
    text: "Dárek, který se nerozbalí za pět minut a nezapadne do šuplíku. Vyplňuje se celé svátky.",
  },
  {
    icon: "cake",
    title: "Narozeniny",
    text: "Místo dalšího svetru kniha, do které se vejde celý život. Kulaté výročí si o ni přímo říká.",
  },
  {
    icon: "heart",
    title: "Výročí",
    text: "Rodiče nebo prarodiče ji můžou vyplňovat spolu a vzpomínat na společnou cestu.",
  },
  {
    icon: "sun",
    title: "Jen tak",
    text: "Nejlepší chvíle na první otázku je dnes. Některé příběhy nemá smysl odkládat.",
  },
];
