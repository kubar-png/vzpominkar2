/**
 * The six life phases of the physical "Kniha vzpomínek" and their default
 * (recommended) questions. Sourced from the app's seed prompt library
 * (supabase/seed.sql) so the book and the app share one question voice.
 *
 * This is the v1 recommended set used to pre-fill the configurator; the
 * standard (non-custom) book ships ~300 questions — that fuller set is a
 * content task tracked in the spec.
 */

export interface BookQuestion {
  id: string;
  text: string;
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
      { id: "d1", text: "Jaká je vaše nejranější vzpomínka? Kolik vám tehdy mohlo být let?" },
      { id: "d2", text: "Kde jste vyrůstali? Popište dům nebo byt, ve kterém jste bydleli." },
      { id: "d3", text: "Jakou hru jste si v dětství nejraději hráli a s kým?" },
      { id: "d4", text: "Co jste mívali na nedělní oběd? A kdo ho vařil?" },
      { id: "d5", text: "Jak vypadaly Vánoce ve vaší rodině, když jste byli malí?" },
    ],
  },
  {
    key: "skola",
    title: "Školní léta",
    questions: [
      { id: "s1", text: "Vzpomínáte si na svůj první školní den? Jaký byl?" },
      { id: "s2", text: "Kdo byl váš nejoblíbenější učitel a proč?" },
      { id: "s3", text: "Měli jste nejlepšího kamaráda nebo kamarádku? Co o nich víte dnes?" },
      { id: "s4", text: "Jaký školní zážitek vás nejvíc potrápil — a jak jste to nakonec zvládli?" },
    ],
  },
  {
    key: "dospivani",
    title: "Dospívání",
    questions: [
      { id: "m1", text: "Co byl váš první větší sen, když vám bylo kolem dvaceti?" },
      { id: "m2", text: "Kam jste jezdili s kamarády? Měli jste nějaké oblíbené místo?" },
      { id: "m3", text: "Jakou hudbu jste poslouchali, když vám bylo dvacet?" },
      { id: "l1", text: "Jak jste se seznámili se svým partnerem? Vzpomínáte si na první setkání?" },
    ],
  },
  {
    key: "rodina",
    title: "Rodina",
    questions: [
      { id: "l2", text: "Jaká byla vaše svatba? Co si z ní pamatujete nejlíp?" },
      { id: "r1", text: "Pamatujete si na den, kdy se vám narodilo první dítě?" },
      { id: "r2", text: "Která rodinná tradice vám byla nejdražší a proč?" },
      { id: "r3", text: "Kdo z rodiny vás nejvíc ovlivnil a v čem?" },
      { id: "r4", text: "Jaký rodinný recept se u vás předává z generace na generaci?" },
    ],
  },
  {
    key: "kariera",
    title: "Kariéra",
    questions: [
      { id: "p1", text: "Jaké bylo vaše první zaměstnání? Jak jste se k němu dostali?" },
      { id: "p2", text: "Co byl nejhezčí den ve vaší kariéře?" },
      { id: "p3", text: "Měli jste kolegu nebo kolegyni, kterých si dodnes vážíte?" },
      { id: "p4", text: "Vzpomínáte si na pracovní výzvu, která vás dost prověřila?" },
    ],
  },
  {
    key: "zraly-vek",
    title: "Zralý věk",
    questions: [
      { id: "z1", text: "Jaký koníček vás dlouhodobě baví? Jak jste se k němu dostali?" },
      { id: "mo1", text: "Co byste poradili svému dvacetiletému já, kdybyste mohli?" },
      { id: "mo2", text: "Co považujete v životě za to nejdůležitější?" },
      { id: "mo3", text: "Když se ohlédnete zpět, na co jste opravdu hrdí?" },
      { id: "mo4", text: "Co by vaše vnoučata měla vědět o světě, ve kterém jste vyrůstali?" },
    ],
  },
];
