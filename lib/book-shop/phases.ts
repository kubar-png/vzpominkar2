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
 *
 * Voice: every question is informal (tykání) — the book is bought for someone
 * close (a parent, grandparent, family member). Where Czech past tense needs a
 * gendered participle we phrase neutrally if it reads well, otherwise use the
 * "-l/a" form (e.g. "vyrůstal/a") so a single text fits any recipient.
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
      { id: "d1", text: "Jaká je tvoje nejranější vzpomínka? Kolik ti tehdy mohlo být let?", recommended: true },
      { id: "d2", text: "Kde jsi vyrůstal/a? Popiš dům nebo byt, ve kterém jsi bydlel/a.", recommended: true },
      { id: "d3", text: "Jakou hru sis jako dítě nejraději hrál/a a s kým?", recommended: true },
      { id: "d4", text: "Co u tebe doma bývalo na nedělní oběd? A kdo ho vařil?", recommended: true },
      { id: "d5", text: "Jak vypadaly Vánoce ve tvé rodině za tvého dětství?", recommended: true },
      { id: "d6", text: "Bylo u tebe doma nějaké zvíře? Jak se jmenovalo?" },
      { id: "d7", text: "Kdo byl v tvém dětství největší autorita?" },
      { id: "d8", text: "Jaká vůně se ti vybaví, když si vzpomeneš na dětství?" },
      { id: "d9", text: "Kam jsi jezdil/a na prázdniny nebo na výlety?" },
      { id: "d10", text: "Jakou největší lumpárnu jsi jako dítě provedl/a?" },
    ],
  },
  {
    key: "skola",
    title: "Školní léta",
    questions: [
      { id: "s1", text: "Vzpomínáš si na svůj první školní den? Jaký byl?", recommended: true },
      { id: "s2", text: "Kdo byl tvůj nejoblíbenější učitel a proč?", recommended: true },
      { id: "s3", text: "Kdo byl tvůj nejlepší kamarád nebo kamarádka? Co o nich víš dnes?", recommended: true },
      { id: "s4", text: "Jaký školní zážitek tě nejvíc potrápil — a jak to nakonec dopadlo?", recommended: true },
      { id: "s5", text: "Jaký předmět tě bavil nejvíc a který naopak vůbec ne?" },
      { id: "s6", text: "Vzpomínáš na nějakou první lásku ze školních let?" },
      { id: "s7", text: "Jak vypadaly tvoje přestávky a cesta do školy?" },
      { id: "s8", text: "Čím jsi chtěl/a být, až vyrosteš?" },
      { id: "s9", text: "Vybavíš si školní příhodu, co tě dodnes rozesměje?" },
    ],
  },
  {
    key: "dospivani",
    title: "Dospívání",
    questions: [
      { id: "m1", text: "Co byl tvůj první větší sen, když ti bylo kolem dvaceti?", recommended: true },
      { id: "m2", text: "Kam jsi jezdil/a s kamarády? Měl/a jsi nějaké oblíbené místo?", recommended: true },
      { id: "m3", text: "Jaká hudba se ti líbila, když ti bylo dvacet?", recommended: true },
      { id: "l1", text: "Jak ses seznámil/a se svým partnerem? Vzpomínáš si na první setkání?", recommended: true },
      { id: "m4", text: "Jaká byla tvoje první brigáda nebo první výplata?" },
      { id: "m5", text: "Co jsi s partou dělával/a o víkendech?" },
      { id: "m6", text: "Jaký byl tvůj tehdejší styl — účes, oblečení?" },
      { id: "m7", text: "Kdo byl tvůj vzor — herec, zpěvák, sportovec?" },
      { id: "m8", text: "Na jakou událost z té doby nikdy nezapomeneš?" },
    ],
  },
  {
    key: "rodina",
    title: "Rodina",
    questions: [
      { id: "l2", text: "Jaká byla tvoje svatba? Co si z ní pamatuješ nejlíp?", recommended: true },
      { id: "r1", text: "Pamatuješ si na den, kdy se ti narodilo první dítě?", recommended: true },
      { id: "r2", text: "Která rodinná tradice ti byla nejdražší a proč?", recommended: true },
      { id: "r3", text: "Kdo z rodiny tě nejvíc ovlivnil a v čem?", recommended: true },
      { id: "r4", text: "Jaký rodinný recept se u tebe v rodině předává z generace na generaci?", recommended: true },
      { id: "r5", text: "Jak jsi vybíral/a jména pro své děti?" },
      { id: "r6", text: "Jaké byly tvoje nejhezčí společné Vánoce nebo dovolená?" },
      { id: "r7", text: "Co tě na rodičovství nejvíc překvapilo?" },
      { id: "r8", text: "Jaké hodnoty byly pro tebe ve výchově nejdůležitější?" },
    ],
  },
  {
    key: "kariera",
    title: "Kariéra",
    questions: [
      { id: "p1", text: "Jaké bylo tvoje první zaměstnání? Jak ses k němu dostal/a?", recommended: true },
      { id: "p2", text: "Co byl nejhezčí den ve tvé kariéře?", recommended: true },
      { id: "p3", text: "Kdo byl kolega nebo kolegyně, kterých si dodnes vážíš?", recommended: true },
      { id: "p4", text: "Vzpomínáš si na pracovní výzvu, která tě pořádně prověřila?", recommended: true },
      { id: "p5", text: "Změnil/a jsi někdy obor nebo zaměstnání? Proč?" },
      { id: "p6", text: "Jaký pracovní úspěch tě dodnes těší?" },
      { id: "p7", text: "Co pro tebe práce v životě znamenala?" },
      { id: "p8", text: "Jak se tvoje řemeslo nebo obor za ta léta změnily?" },
    ],
  },
  {
    key: "zraly-vek",
    title: "Zralý věk",
    questions: [
      { id: "mo3", text: "Když se ohlédneš zpět, co v tobě vzbuzuje největší hrdost?", recommended: true },
      { id: "mo1", text: "Co bys poradil/a svému dvacetiletému já?", recommended: true },
      { id: "mo2", text: "Co považuješ v životě za to nejdůležitější?", recommended: true },
      { id: "mo4", text: "Co by tvoje vnoučata měla vědět o světě tvého mládí?", recommended: true },
      { id: "z1", text: "Jaký koníček tě dlouhodobě baví? Jak ses k němu dostal/a?", recommended: true },
      { id: "z2", text: "Co tě dnes dělá nejšťastnější?" },
      { id: "z3", text: "Jaké místo na světě máš nejradši a proč?" },
      { id: "z4", text: "Co se ti v životě nejvíc povedlo?" },
      { id: "z5", text: "Je něco, co bys ještě chtěl/a zažít?" },
    ],
  },
];
