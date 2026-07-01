import "server-only";

const POLISH_TIMEOUT_MS = 28_000; // stay under Vercel's 30s function ceiling

const SYSTEM_LIGHT = `Jsi editor českého přepisu mluveného slova.

Tvůj úkol: odstranit z textu výplňová slova a zaškobrtání, jinak nech přepis přesně tak.

ODSTRAŇ:
- vokalizmy: ehm, ehhh, eee, uh, uhh, ahh, nó, hmm
- výplně: "no", "jakože", "prostě" (jen když nemají skutečný význam ve větě), "vlastně" jako vsuvka, "že jo", "no jo"
- opakovaná slova ("já-já", "to-to-bylo")
- falešné začátky ("já jsem-, on říkal")

NIKDY NEMĚŇ:
- význam ani fakta
- slang a nářečí ("ten", "víšco", "no jo")
- emoce ani osobní výrazy
- pořadí vět
- gramatiku či pravopis tam kde je správný

Vrať POUZE upravený text bez quotů, bez vysvětlení, bez markdownu.`;

const SYSTEM_FULL = `Jsi editor českého přepisu mluveného slova, který připravuje text na otisk v knize.

Tvůj úkol: očistit text a uhladit věty tak, aby se daly číst plynule jako próza, ale zachovat hlas vypravěče.

UDĚLEJ:
- NEJDŘÍV si přečti celou vzpomínku a oprav chyby přepisu podle kontextu: slovo,
  které v dané větě nedává smysl, nahraď tím, které vypravěč zjevně řekl a co do
  věty logicky patří (např. "chodili jsme za roch na kávu" → "za roh",
  "byla sme doma" → "byli jsme doma"). Používej okolní věty jako vodítko.
- odstraň výplně, vokalizmy (ehm, eee, uh, ahh, hmm), opakování, falešné začátky
- spoj rozsekané věty do plynulých
- doplň interpunkci tam kde chybí (čárky, tečky)
- oprav drobné gramatické zaškobrtání mluveného projevu
- převeď zjevné překlepy fonetickou interpretací (např. "fčera" → "včera")

NIKDY NEMĚŇ:
- význam ani fakta
- slang, nářečí, oblíbená spojení vypravěče (jsou součást hlasu)
- osobní oslovení, jména, místní názvy
- chronologii nebo strukturu příběhu
- nepřidávej nové informace, fráze, dramatizace

Hovorové formy a osobní výrazy ZACHOVEJ, jen je dej do koherentnějšího toku.

Vrať POUZE upravený text bez quotů, bez vysvětlení, bez markdownu.`;

const PROMPTS = {
  light: SYSTEM_LIGHT,
  full: SYSTEM_FULL,
} as const;

export type PolishLevel = keyof typeof PROMPTS;

/**
 * Polish a transcript using OpenAI Chat Completions.
 * - `light` removes filler words + stutters, leaves sentences as-is
 * - `full` additionally smooths sentence flow into readable prose
 *
 * Returns null on failure (network, key missing, bad response).
 */
export async function polishTranscript(
  raw: string,
  level: PolishLevel,
): Promise<string | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const ctl = new AbortController();
  const timeout = setTimeout(() => ctl.abort(), POLISH_TIMEOUT_MS);

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.3,
        messages: [
          { role: "system", content: PROMPTS[level] },
          { role: "user", content: trimmed },
        ],
      }),
      signal: ctl.signal,
    });
    if (!res.ok) {
      console.error("[polish] non-200", res.status, await res.text().catch(() => ""));
      return null;
    }
    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const out = json.choices?.[0]?.message?.content?.trim();
    return out || null;
  } catch (err) {
    console.error("[polish] failed", err);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
