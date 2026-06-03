/**
 * Czech grammatical gender for addressing the memoir subject (tykání).
 *
 * Gendered copy is authored with a single token that carries BOTH forms:
 *
 *     "Kde jsi {vyrůstal|vyrůstala}? Popiš dům, ve kterém jsi {bydlel|bydlela}."
 *
 * `resolveGender()` renders one of three ways:
 *   - "male"   → masculine  ("vyrůstal")
 *   - "female" → feminine   ("vyrůstala")
 *   - null     → slash fallback for unknown gender ("vyrůstal/a", "hrdý/á")
 *
 * The fallback means any consumer that doesn't yet know the gender can pass
 * `null` and still get the familiar slash form — so the token rollout is safe
 * to do piecemeal.
 */

export type Gender = "male" | "female";

// Matches "{masc|fem}" with no nested braces or extra pipes.
const TOKEN = /\{([^{}|]*)\|([^{}|]*)\}/g;

export function resolveGender(text: string, gender: Gender | null | undefined): string {
  return text.replace(TOKEN, (_match, masc: string, fem: string) =>
    gender === "male" ? masc : gender === "female" ? fem : slashForm(masc, fem),
  );
}

/** "vyrůstal","vyrůstala" → "vyrůstal/a"; "hrdý","hrdá" → "hrdý/á". */
function slashForm(masc: string, fem: string): string {
  let i = 0;
  while (i < masc.length && i < fem.length && masc[i] === fem[i]) i += 1;
  const femTail = fem.slice(i);
  return femTail ? `${masc}/${femTail}` : masc;
}

const FEMALE_ROLES = new Set(["babicka", "mama", "prababicka", "teta"]);
const MALE_ROLES = new Set(["dedecek", "tata", "pradedecek", "stryc"]);

/**
 * Default a person's gender from their family-relationship label
 * (`profiles.senior_role`). Returns null for "jine"/unknown so the caller can
 * ask explicitly.
 */
export function genderFromSeniorRole(role: string | null | undefined): Gender | null {
  if (!role) return null;
  if (FEMALE_ROLES.has(role)) return "female";
  if (MALE_ROLES.has(role)) return "male";
  return null;
}
