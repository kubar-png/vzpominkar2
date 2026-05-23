import "server-only";

/**
 * Extract "when did this happen" from a memory's text/transcript using
 * gpt-4o-mini in JSON mode. Cheap (~$0.0002 per call), non-blocking — if
 * the call fails or returns nothing useful, the memory just doesn't carry
 * a temporal anchor. The recorder is never forced to fill a year field.
 */

const EXTRACT_TIMEOUT_MS = 18_000;

const SYSTEM = `Jsi asistent, který z českého vyprávění vytahuje, KDY se popisovaná událost stala.

Tvůj úkol: přečíst text a vrátit JSON s těmito poli:

{
  "year": <číslo roku 1900-2030, nebo null pokud nelze určit>,
  "year_label": <český opis období v původním tónu vypravěče, např. "léto 1958", "padesátá léta", "po válce", "když mi bylo deset". Null pokud žádný časový kotvící bod>,
  "confidence": "high" | "medium" | "low"
}

PRAVIDLA:

- year: nejlepší numerický odhad. Pokud vypravěč říká "v padesátých letech", year=1955 (střed dekády). Pokud "po revoluci", year=1990. Pokud "když mi bylo deset" a víš věk vypravěče, spočti — ale obvykle nevíš, takže year=null. Pokud "minulý víkend", null (současnost se neukládá jako historický rok).

- year_label: lidský opis JAK to vypravěč řekl. Zachovej jeho tón. Nepřekládej "padesátá léta" na "1950s". Pokud vypravěč říká "léto 1958", label="léto 1958". Pokud "v dětství", label="dětství". Null pokud žádné období nezmíněno.

- confidence:
  - "high" — vypravěč zmínil konkrétní rok nebo precizní období ("1958", "léto 1973", "v devadesátém")
  - "medium" — zmíněna dekáda nebo věk vypravěče ("padesátá léta", "v sedmnácti")
  - "low" — vágní časový kotvící bod ("v mládí", "kdysi", "dávno")

Pokud text obsahuje žádný časový odkaz, vrať { "year": null, "year_label": null, "confidence": "low" }.

Odpovídej POUZE platným JSON, žádný prose, žádný markdown.`;

export interface ExtractedYear {
  year: number | null;
  year_label: string | null;
  confidence: "high" | "medium" | "low";
}

const EMPTY: ExtractedYear = { year: null, year_label: null, confidence: "low" };

export async function extractYear(text: string): Promise<ExtractedYear> {
  if (!text || text.trim().length < 20) return EMPTY;

  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    console.warn("[extract-metadata] OPENAI_API_KEY missing, skipping");
    return EMPTY;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), EXTRACT_TIMEOUT_MS);

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.1,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: text.slice(0, 6000) },
        ],
      }),
    });

    if (!res.ok) {
      console.warn("[extract-metadata] OpenAI non-2xx:", res.status);
      return EMPTY;
    }

    const data = await res.json();
    const raw = data?.choices?.[0]?.message?.content;
    if (typeof raw !== "string") return EMPTY;

    const parsed = JSON.parse(raw) as Partial<ExtractedYear>;

    const year =
      typeof parsed.year === "number" && parsed.year >= 1900 && parsed.year <= 2030
        ? Math.round(parsed.year)
        : null;
    const label =
      typeof parsed.year_label === "string" && parsed.year_label.trim().length > 0
        ? parsed.year_label.trim().slice(0, 80)
        : null;
    const confidence =
      parsed.confidence === "high" || parsed.confidence === "medium"
        ? parsed.confidence
        : "low";

    return { year, year_label: label, confidence };
  } catch (err) {
    if ((err as Error).name === "AbortError") {
      console.warn("[extract-metadata] timeout");
    } else {
      console.warn("[extract-metadata] error:", err);
    }
    return EMPTY;
  } finally {
    clearTimeout(timeoutId);
  }
}
