/**
 * The six life phases of the physical "Kniha vzpomínek" and their suggested
 * questions. `recommended: true` questions start in the book by default (fast
 * path = accept them and order); the rest sit in the left "suggestions" pool
 * of the configurator and are one click away from being added.
 *
 * Recommended questions are sourced from the app's seed prompt library
 * (supabase/seed.sql); the additional suggestions extend each phase so there's
 * always something to pick from. The standard (non-custom) book ships ~300
 * questions — that fuller set is a content task tracked in the spec.
 */

export interface BookQuestion {
  id: string;
  text: string;
  recommended?: boolean;
}

export interface BookPhase {
  key: string;
  title: string;
  questions: BookQuestion[];
}

export const DEFAULT_VERSION = "v1";

export const BOOK_PHASES: BookPhase[] = [
  {
    key: "detstvi",
    title: "Dětství",
    questions: [
      { id: "d1", text: "Jaká je vaše nejranější vzpomínka? Kolik vám tehdy mohlo být let?", recommended: true },
      { id: "d2", text: "Kde jste vyrůstali? Popište dům nebo byt, ve kterém jste bydleli.", recommended: true },
      { id: "d3", text: "Jakou hru jste si v dětství nejraději hráli a s kým?", recommended: true },
      { id: "d4", text: "Co jste mívali na nedělní oběd? A kdo ho vařil?", recommended: true },
      { id: "d5", text: "Jak vypadaly Vánoce ve vaší rodině, když jste byli malí?", recommended: true },
      { id: "d6", text: "Měli jste doma nějaké zvíře? Jak se jmenovalo?" },
      { id: "d7", text: "Kdo byl ve vašem dětství největší autorita?" },
      { id: "d8", text: "Jaká vůně se vám vybaví, když si vzpomenete na dětství?" },
      { id: "d9", text: "Kam jste jezdili na prázdniny nebo na výlety?" },
      { id: "d10", text: "Jakou největší lumpárnu jste jako dítě provedli?" },
    ],
  },
  {
    key: "skola",
    title: "Školní léta",
    questions: [
      { id: "s1", text: "Vzpomínáte si na svůj první školní den? Jaký byl?", recommended: true },
      { id: "s2", text: "Kdo byl váš nejoblíbenější učitel a proč?", recommended: true },
      { id: "s3", text: "Měli jste nejlepšího kamaráda nebo kamarádku? Co o nich víte dnes?", recommended: true },
      { id: "s4", text: "Jaký školní zážitek vás nejvíc potrápil — a jak jste to nakonec zvládli?", recommended: true },
      { id: "s5", text: "Jaký předmět vás bavil nejvíc a který naopak vůbec ne?" },
      { id: "s6", text: "Vzpomínáte na nějakou první lásku ze školních let?" },
      { id: "s7", text: "Jak jste trávili přestávky a cestu do školy?" },
      { id: "s8", text: "Čím jste chtěli být, až vyrostete?" },
      { id: "s9", text: "Vybavíte si školní příhodu, co vás dodnes rozesměje?" },
    ],
  },
  {
    key: "dospivani",
    title: "Dospívání",
    questions: [
      { id: "m1", text: "Co byl váš první větší sen, když vám bylo kolem dvaceti?", recommended: true },
      { id: "m2", text: "Kam jste jezdili s kamarády? Měli jste nějaké oblíbené místo?", recommended: true },
      { id: "m3", text: "Jakou hudbu jste poslouchali, když vám bylo dvacet?", recommended: true },
      { id: "l1", text: "Jak jste se seznámili se svým partnerem? Vzpomínáte si na první setkání?", recommended: true },
      { id: "m4", text: "Jaká byla vaše první brigáda nebo první výplata?" },
      { id: "m5", text: "Co jste s partou dělali o víkendech?" },
      { id: "m6", text: "Jaký účes nebo oblečení jste tehdy nosili?" },
      { id: "m7", text: "Měli jste nějaký vzor — herce, zpěváka, sportovce?" },
      { id: "m8", text: "Na jakou událost z té doby nikdy nezapomenete?" },
    ],
  },
  {
    key: "rodina",
    title: "Rodina",
    questions: [
      { id: "l2", text: "Jaká byla vaše svatba? Co si z ní pamatujete nejlíp?", recommended: true },
      { id: "r1", text: "Pamatujete si na den, kdy se vám narodilo první dítě?", recommended: true },
      { id: "r2", text: "Která rodinná tradice vám byla nejdražší a proč?", recommended: true },
      { id: "r3", text: "Kdo z rodiny vás nejvíc ovlivnil a v čem?", recommended: true },
      { id: "r4", text: "Jaký rodinný recept se u vás předává z generace na generaci?", recommended: true },
      { id: "r5", text: "Jak jste vybírali jména svým dětem?" },
      { id: "r6", text: "Jaké byly vaše nejhezčí společné Vánoce nebo dovolená?" },
      { id: "r7", text: "Co vás na rodičovství nejvíc překvapilo?" },
      { id: "r8", text: "Jaké hodnoty jste chtěli předat svým dětem?" },
    ],
  },
  {
    key: "kariera",
    title: "Kariéra",
    questions: [
      { id: "p1", text: "Jaké bylo vaše první zaměstnání? Jak jste se k němu dostali?", recommended: true },
      { id: "p2", text: "Co byl nejhezčí den ve vaší kariéře?", recommended: true },
      { id: "p3", text: "Měli jste kolegu nebo kolegyni, kterých si dodnes vážíte?", recommended: true },
      { id: "p4", text: "Vzpomínáte si na pracovní výzvu, která vás dost prověřila?", recommended: true },
      { id: "p5", text: "Změnili jste někdy obor nebo zaměstnání? Proč?" },
      { id: "p6", text: "Na jaký pracovní úspěch jste nejvíc hrdí?" },
      { id: "p7", text: "Co pro vás práce v životě znamenala?" },
      { id: "p8", text: "Jak se vaše řemeslo nebo obor za ta léta změnily?" },
    ],
  },
  {
    key: "zraly-vek",
    title: "Zralý věk",
    questions: [
      { id: "mo3", text: "Když se ohlédnete zpět, na co jste opravdu hrdí?", recommended: true },
      { id: "mo1", text: "Co byste poradili svému dvacetiletému já, kdybyste mohli?", recommended: true },
      { id: "mo2", text: "Co považujete v životě za to nejdůležitější?", recommended: true },
      { id: "mo4", text: "Co by vaše vnoučata měla vědět o světě, ve kterém jste vyrůstali?", recommended: true },
      { id: "z1", text: "Jaký koníček vás dlouhodobě baví? Jak jste se k němu dostali?", recommended: true },
      { id: "z2", text: "Co vás dnes dělá nejšťastnější?" },
      { id: "z3", text: "Jaké místo na světě máte nejradši a proč?" },
      { id: "z4", text: "Co se vám v životě nejvíc povedlo?" },
      { id: "z5", text: "Je něco, co byste ještě chtěli zažít?" },
    ],
  },
];
