import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { extractYear } from "@/lib/memories/extract-metadata";

// Stub fetch to return an OpenAI chat-completion whose message content is `content`.
function mockOpenAI(content: unknown): typeof fetch {
  return vi.fn(async () => ({
    ok: true,
    status: 200,
    json: async () => ({ choices: [{ message: { content } }] }),
  })) as unknown as typeof fetch;
}

const LONG_TEXT =
  "Tohle je dostatečně dlouhé vyprávění o tom, jak jsme se měli kdysi dávno na vesnici.";

describe("extractYear — external-JSON normalization", () => {
  const realKey = process.env.OPENAI_API_KEY;
  beforeEach(() => {
    process.env.OPENAI_API_KEY = "test-key";
  });
  afterEach(() => {
    if (realKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = realKey;
    vi.unstubAllGlobals();
  });

  it("returns EMPTY for too-short text without calling OpenAI", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    expect(await extractYear("krátké")).toEqual({ year: null, year_label: null, confidence: "low" });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("passes through a valid year + label + confidence", async () => {
    vi.stubGlobal(
      "fetch",
      mockOpenAI(JSON.stringify({ year: 1958, year_label: "léto 1958", confidence: "high" })),
    );
    expect(await extractYear(LONG_TEXT)).toEqual({
      year: 1958,
      year_label: "léto 1958",
      confidence: "high",
    });
  });

  it("clamps out-of-range years to null", async () => {
    vi.stubGlobal("fetch", mockOpenAI(JSON.stringify({ year: 1850, confidence: "low" })));
    expect((await extractYear(LONG_TEXT)).year).toBeNull();
    vi.stubGlobal("fetch", mockOpenAI(JSON.stringify({ year: 2099, confidence: "low" })));
    expect((await extractYear(LONG_TEXT)).year).toBeNull();
  });

  it("coerces an invalid confidence to 'low'", async () => {
    vi.stubGlobal("fetch", mockOpenAI(JSON.stringify({ year: null, confidence: "bogus" })));
    expect((await extractYear(LONG_TEXT)).confidence).toBe("low");
  });

  it("returns EMPTY when the model content is not a string", async () => {
    vi.stubGlobal("fetch", mockOpenAI(42));
    expect(await extractYear(LONG_TEXT)).toEqual({ year: null, year_label: null, confidence: "low" });
  });

  it("returns EMPTY on a non-2xx response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, status: 500, json: async () => ({}) })) as unknown as typeof fetch,
    );
    expect(await extractYear(LONG_TEXT)).toEqual({ year: null, year_label: null, confidence: "low" });
  });
});
