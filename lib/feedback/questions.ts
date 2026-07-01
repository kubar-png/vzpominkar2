/**
 * Tester feedback survey — the ordered question set behind the Typeform-style
 * /testovani flow. Pure data (no "use server"): imported by both the client
 * survey UI and the submitFeedback server action so they agree on ids/shape.
 *
 * Czech copy, vykání to the buyer/tester. Keep it warm, calm, low-friction.
 */

export type FeedbackKind = "nps" | "scale" | "choice" | "text" | "email";

export interface ChoiceOption {
  value: string;
  label: string;
}

export interface FeedbackQuestion {
  id: string;
  kind: FeedbackKind;
  prompt: string;
  /** Optional questions can be skipped without an answer. */
  optional?: boolean;
  /** For kind:'scale' — numeric bounds and their end labels. */
  min?: number;
  max?: number;
  minLabel?: string;
  maxLabel?: string;
  /** For kind:'choice' — the selectable options. */
  options?: ChoiceOption[];
  /** For kind:'choice' — allow a free-text "jiné" answer alongside options. */
  allowOther?: boolean;
}

/** Willingness-to-pay one-time price ranges (reused by wtp_good + wtp_expensive). */
const WTP_RANGES: ChoiceOption[] = [
  { value: "lt_990", label: "do 990 Kč" },
  { value: "1000_1990", label: "1 000–1 990 Kč" },
  { value: "2000_2990", label: "2 000–2 990 Kč" },
  { value: "3000_3990", label: "3 000–3 990 Kč" },
  { value: "gte_4000", label: "4 000 Kč a víc" },
  { value: "unknown", label: "Nevím" },
];

export const FEEDBACK_QUESTIONS: FeedbackQuestion[] = [
  {
    id: "nps",
    kind: "nps",
    prompt: "Jak pravděpodobně byste Vzpomínkář doporučil/a příteli nebo rodině?",
    min: 0,
    max: 10,
  },
  {
    id: "value",
    kind: "scale",
    min: 1,
    max: 5,
    minLabel: "Vůbec",
    maxLabel: "Nesmírně",
    prompt: "Jak cenné vám přijde takto uchovat vzpomínky vašeho blízkého?",
  },
  {
    id: "ease_setup",
    kind: "scale",
    min: 1,
    max: 5,
    minLabel: "Velmi těžké",
    maxLabel: "Velmi snadné",
    prompt: "Jak snadné bylo založit účet a přidat blízkého?",
  },
  {
    id: "ease_senior",
    kind: "scale",
    min: 1,
    max: 5,
    minLabel: "Velmi těžké",
    maxLabel: "Velmi snadné",
    prompt: "Jak snadné to podle vás bylo pro vašeho blízkého — odpovědět na otázku?",
  },
  {
    id: "friction",
    kind: "text",
    optional: true,
    prompt: "Bylo něco matoucího nebo místo, kde jste se zasekli?",
  },
  {
    id: "business_model",
    kind: "choice",
    allowOther: true,
    prompt: "Který způsob placení by vám dával největší smysl?",
    options: [
      { value: "one_time_all", label: "Jednou zaplatím vše — aplikaci i tištěnou knihu" },
      {
        value: "app_then_book",
        label: "Zaplatím za aplikaci, tištěnou knihu doplatím, až bude hotová",
      },
      {
        value: "subscription_plus_book",
        label: "Měsíční předplatné za aplikaci, knihu zaplatím zvlášť",
      },
      { value: "free_app_paid_book", label: "Aplikace zdarma, platím jen tištěnou knihu" },
    ],
  },
  {
    id: "wtp_good",
    kind: "choice",
    prompt: "Za kolik by vám rok otázek + jedna tištěná kniha přišel jako dobrá koupě?",
    options: WTP_RANGES,
  },
  {
    id: "wtp_expensive",
    kind: "choice",
    prompt: "A za kolik už by to bylo tak drahé, že byste to nekoupil/a?",
    options: WTP_RANGES,
  },
  {
    id: "wtp_subscription",
    kind: "choice",
    optional: true,
    prompt: "Kdyby to bylo měsíční předplatné, kolik za měsíc je férové?",
    options: [
      { value: "lt_99", label: "do 99 Kč" },
      { value: "100_199", label: "100–199 Kč" },
      { value: "200_349", label: "200–349 Kč" },
      { value: "350_499", label: "350–499 Kč" },
      { value: "gte_500", label: "500 Kč a víc" },
      { value: "unknown", label: "Nevím" },
    ],
  },
  {
    id: "convince",
    kind: "text",
    prompt: "Co by vás nejvíc přesvědčilo Vzpomínkář opravdu koupit?",
  },
  {
    id: "missing",
    kind: "text",
    optional: true,
    prompt: "Chybělo vám něco, nebo co byste přidali?",
  },
  {
    id: "contact_email",
    kind: "email",
    optional: true,
    prompt: "Necháte nám e-mail, ať vás pozveme mezi první uživatele?",
  },
];
