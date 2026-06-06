import { describe, it, expect, vi, afterEach } from "vitest";
import {
  firstName,
  isGsm7,
  estimateSmsSegments,
  renderSms,
  renderWhatsApp,
  type RenderContext,
} from "@/lib/messaging/render";

/**
 * render.ts — per-channel renderers for the weekly question.
 *
 * The wrapper is platform voice (vykání: "má pro vás novou otázku"); the embedded
 * question is rendered verbatim (already gender-resolved + tykání by the caller).
 * Spec §5 / §8.3. We assert: owner first name, verbatim question, action URL,
 * the vykání wrapper, UCS-2 70-char segmentation under diacritics, the >5-segment
 * warning, and that the link is always present.
 */

const LINK = "https://vzpominkar.cz/q/magic-token-123";

function ctx(over: Partial<RenderContext> = {}): RenderContext {
  return {
    ownerFirstName: "Jakub Novák",
    question: "Vzpomeneš si na svůj první školní den?",
    actionUrl: LINK,
    seniorDisplayName: "Babička Marie",
    ...over,
  };
}

describe("firstName", () => {
  it("returns the first token of a multi-word name", () => {
    expect(firstName("Jakub Novák")).toBe("Jakub");
  });
  it("returns the input unchanged for a single token", () => {
    expect(firstName("Jakub")).toBe("Jakub");
  });
  it("returns '' for null/undefined/blank", () => {
    expect(firstName(null)).toBe("");
    expect(firstName(undefined)).toBe("");
    expect(firstName("   ")).toBe("");
  });
});

describe("isGsm7", () => {
  it("is true for pure-ASCII", () => {
    expect(isGsm7("Hello there 123")).toBe(true);
  });
  it("is false once a Czech diacritic appears", () => {
    expect(isGsm7("první školní den")).toBe(false);
  });
});

describe("estimateSmsSegments", () => {
  it("bills pure-ASCII at 160 chars per single segment", () => {
    expect(estimateSmsSegments("a".repeat(160))).toBe(1);
    expect(estimateSmsSegments("a".repeat(161))).toBe(2); // ceil(161/153)
  });

  it("uses 70-char UCS-2 segmentation when diacritics are present", () => {
    // 70 diacritic chars → exactly one UCS-2 segment.
    expect(estimateSmsSegments("á".repeat(70))).toBe(1);
    // 71 → tips into multi-part, billed at 67/segment → ceil(71/67) = 2.
    expect(estimateSmsSegments("á".repeat(71))).toBe(2);
  });

  it("counts astral chars (emoji) as 2 UCS-2 units", () => {
    // A single emoji forces UCS-2 and costs 2 units → still one segment.
    expect(estimateSmsSegments("😀")).toBe(1);
    // 35 emoji = 70 units = one full UCS-2 segment.
    expect(estimateSmsSegments("😀".repeat(35))).toBe(1);
    expect(estimateSmsSegments("😀".repeat(36))).toBe(2);
  });
});

describe("renderSms", () => {
  afterEach(() => vi.restoreAllMocks());

  it("contains the owner FIRST name, the verbatim question, and the action URL", () => {
    const msg = renderSms(ctx());
    expect(msg.text).toContain("Jakub"); // first name only
    expect(msg.text).not.toContain("Novák"); // not the full name
    expect(msg.text).toContain("Vzpomeneš si na svůj první školní den?"); // verbatim
    expect(msg.text).toContain(LINK); // link always present
  });

  it("uses the gender-neutral vykání wrapper", () => {
    const msg = renderSms(ctx());
    expect(msg.text).toContain("má pro vás novou otázku");
    expect(msg.text).toContain("Odpověď nahrajete tady:");
    // never the gendered "se vás zeptal/a" form
    expect(msg.text).not.toMatch(/zeptal/);
  });

  it("tags the message weekly_reminder", () => {
    expect(renderSms(ctx()).tag).toBe("weekly_reminder");
  });

  it("throws when the action URL is missing (the link is the whole point)", () => {
    expect(() => renderSms(ctx({ actionUrl: "" }))).toThrow(/actionUrl/);
  });

  it("warns when the rendered SMS would bill more than 5 segments", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    // ~400 diacritic chars + wrapper → well past the 5×67 = 335 UCS-2 cap.
    const longQuestion = "á".repeat(400);
    const msg = renderSms(ctx({ question: longQuestion }));
    expect(estimateSmsSegments(msg.text)).toBeGreaterThan(5);
    expect(warn).toHaveBeenCalledOnce();
    expect(warn.mock.calls[0]?.[0]).toMatch(/segments/);
    // Even an abnormally long question never drops the link.
    expect(msg.text).toContain(LINK);
  });

  it("does NOT warn for a normal-length question", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    renderSms(ctx());
    expect(warn).not.toHaveBeenCalled();
  });

  const OPT_OUT = "https://vzpominkar.cz/odhlasit/magic-token-123?kanal=sms";

  it("appends the Art. 14 notice/opt-out line when optOutUrl is set", () => {
    const msg = renderSms(ctx({ optOutUrl: OPT_OUT }));
    expect(msg.text).toContain("Proč vám píšeme a jak se odhlásit:");
    expect(msg.text).toContain(OPT_OUT);
    // The record link and question are still present (non-promotional, additive).
    expect(msg.text).toContain(LINK);
    expect(msg.text).toContain("Vzpomeneš si na svůj první školní den?");
  });

  it("omits the opt-out line when optOutUrl is absent (no magic_token)", () => {
    const msg = renderSms(ctx());
    expect(msg.text).not.toContain("odhlásit");
    expect(msg.text).not.toContain("/odhlasit/");
  });
});

describe("renderWhatsApp", () => {
  it("mirrors the SMS copy and exposes template params [owner, question, url]", () => {
    const msg = renderWhatsApp(ctx());
    expect(msg.text).toContain("Jakub");
    expect(msg.text).toContain("Vzpomeneš si na svůj první školní den?");
    expect(msg.text).toContain(LINK);
    expect(msg.text).toContain("má pro vás novou otázku");
    expect(msg.templateParams).toEqual([
      "Jakub",
      "Vzpomeneš si na svůj první školní den?",
      LINK,
    ]);
  });

  it("throws when the action URL is missing", () => {
    expect(() => renderWhatsApp(ctx({ actionUrl: "" }))).toThrow(/actionUrl/);
  });

  it("adds a 4th template var + opt-out line when optOutUrl is set", () => {
    const OPT_OUT = "https://vzpominkar.cz/odhlasit/magic-token-123?kanal=whatsapp";
    const msg = renderWhatsApp(ctx({ optOutUrl: OPT_OUT }));
    expect(msg.text).toContain("Proč vám píšeme a jak se odhlásit:");
    expect(msg.text).toContain(OPT_OUT);
    expect(msg.templateParams).toEqual([
      "Jakub",
      "Vzpomeneš si na svůj první školní den?",
      LINK,
      OPT_OUT,
    ]);
  });

  it("keeps the 3-var template form when optOutUrl is absent", () => {
    const msg = renderWhatsApp(ctx());
    expect(msg.templateParams).toHaveLength(3);
    expect(msg.text).not.toContain("odhlásit");
  });
});

/**
 * Non-promotional guarantee (task 2b). SMS/WhatsApp are sent on the
 * legitimate-interest basis (čl. 6 odst. 1 písm. f), NOT as marketing — so the
 * body must carry the opt-out link and must NEVER contain a marketing/sales
 * token. We assert the rendered text (and the WhatsApp template params) against a
 * denylist, in BOTH the with-optOutUrl and without-optOutUrl forms, so a future
 * copy edit that slips in a promo word fails loudly.
 */
describe("render — non-promotional content (Art. 6(1)(f) basis, task 2b)", () => {
  // Czech marketing/sales vocabulary that must never appear in a legitimate-interest message.
  const PROMO_DENYLIST = ["objednejte", "sleva", "navštivte", "koupit", "akce"];
  const OPT_OUT_SMS = "https://vzpominkar.cz/odhlasit/magic-token-123?kanal=sms";
  const OPT_OUT_WA = "https://vzpominkar.cz/odhlasit/magic-token-123?kanal=whatsapp";

  function assertNoPromo(text: string) {
    const lower = text.toLowerCase();
    for (const token of PROMO_DENYLIST) {
      expect(lower).not.toContain(token);
    }
  }

  it("SMS contains the opt-out link and NO promotional token (with optOutUrl)", () => {
    const msg = renderSms(ctx({ optOutUrl: OPT_OUT_SMS }));
    expect(msg.text).toContain(OPT_OUT_SMS); // opt-out link present
    assertNoPromo(msg.text);
  });

  it("SMS contains NO promotional token (without optOutUrl)", () => {
    assertNoPromo(renderSms(ctx()).text);
  });

  it("WhatsApp contains the opt-out link and NO promotional token (with optOutUrl)", () => {
    const msg = renderWhatsApp(ctx({ optOutUrl: OPT_OUT_WA }));
    expect(msg.text).toContain(OPT_OUT_WA); // opt-out link present
    assertNoPromo(msg.text);
    // The positional template params Meta actually sends must also be clean.
    for (const param of msg.templateParams) assertNoPromo(param);
  });

  it("WhatsApp contains NO promotional token (without optOutUrl)", () => {
    const msg = renderWhatsApp(ctx());
    assertNoPromo(msg.text);
    for (const param of msg.templateParams) assertNoPromo(param);
  });
});
