/**
 * Czech noun pluralization based on a count.
 *
 * The three Czech plural forms map to:
 *   - n === 1            → singular  ("vzpomínka")
 *   - n ∈ {2, 3, 4}      → paucal    ("vzpomínky")
 *   - everything else    → plural    ("vzpomínek")
 *
 * The forms come in as a `[singular, paucal, plural]` tuple to keep the
 * call site self-documenting and let TypeScript catch wrong arities.
 *
 * @example
 *   plural(1, ["týden", "týdny", "týdnů"])  // "týden"
 *   plural(3, ["týden", "týdny", "týdnů"])  // "týdny"
 *   plural(7, ["týden", "týdny", "týdnů"])  // "týdnů"
 */
export function plural(
  n: number,
  forms: readonly [singular: string, paucal: string, plural: string],
): string {
  if (n === 1) return forms[0];
  if (n >= 2 && n <= 4) return forms[1];
  return forms[2];
}
