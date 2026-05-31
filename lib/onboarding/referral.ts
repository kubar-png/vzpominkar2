/**
 * Acquisition-attribution sources — kept in sync with the
 * `families.referral_source` DB check constraint. Plain module (no
 * "use server") so it can export these constants to both the action and
 * the page.
 */
export const REFERRAL_SOURCES = [
  { value: "social", label: "Sociální sítě" },
  { value: "google", label: "Google / vyhledávání" },
  { value: "ai", label: "Umělá inteligence" },
  { value: "friend", label: "Doporučení od známého" },
  { value: "media", label: "Článek / média" },
  { value: "other", label: "Něco jiného" },
] as const;

export const REFERRAL_VALUES: readonly string[] = REFERRAL_SOURCES.map((s) => s.value);
