import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createHash } from "node:crypto";
import { SmsbranaProvider, createSmsProvider } from "@/lib/messaging/providers/smsbrana";
import type { DeliveryRecipient, RenderedMessage } from "@/lib/messaging/types";

/**
 * smsbrana SMS provider.
 *
 * Asserts the salted-hash auth = md5(password + time + sul) for the EXACT values
 * the provider transmitted (no clock freezing needed — we read back time/sul from
 * the captured request and recompute), the request shape (action/login/time/sul/
 * auth/number-without-'+'/message), XML extraction of sms_id/sms_count/price/
 * credit, the err!=0 throw, and the NOOP path (no fetch, synthetic id).
 */

const RECIPIENT: DeliveryRecipient = { channel: "sms", address: "+420777123456" };
const MSG: RenderedMessage = { text: "Jakub má pro vás novou otázku: …", tag: "weekly_reminder" };

function okXml(over: Partial<Record<string, string>> = {}): string {
  const fields = {
    err: "0",
    sms_id: "987654",
    sms_count: "3",
    price: "1.50",
    credit: "248.50",
    ...over,
  };
  const body = Object.entries(fields)
    .map(([k, v]) => `<${k}>${v}</${k}>`)
    .join("");
  return `<?xml version="1.0" encoding="utf-8"?><result>${body}</result>`;
}

/** Stub fetch; capture each call's body as URLSearchParams. */
function stubFetch(xml: string) {
  const calls: { url: string; params: URLSearchParams }[] = [];
  const fetchSpy = vi.fn(async (url: string, init?: { body?: string }) => {
    calls.push({ url, params: new URLSearchParams(init?.body ?? "") });
    return { ok: true, status: 200, text: async () => xml } as unknown as Response;
  });
  vi.stubGlobal("fetch", fetchSpy);
  return { calls, fetchSpy };
}

describe("SmsbranaProvider — request + auth", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("auth equals md5(password + time + sul) for the values actually sent", async () => {
    const { calls } = stubFetch(okXml());
    const provider = new SmsbranaProvider("my-login", "s3cret-pass");

    await provider.send(RECIPIENT, MSG);

    expect(calls).toHaveLength(1);
    const p = calls[0]!.params;
    const time = p.get("time")!;
    const sul = p.get("sul")!;
    const auth = p.get("auth")!;

    const expected = createHash("md5").update("s3cret-pass" + time + sul).digest("hex");
    expect(auth).toBe(expected);
  });

  it("sends action=send_sms, login, time, sul, auth, number without '+', message", async () => {
    const { calls } = stubFetch(okXml());
    const provider = new SmsbranaProvider("my-login", "s3cret-pass");

    await provider.send(RECIPIENT, MSG);

    const p = calls[0]!.params;
    expect(p.get("action")).toBe("send_sms");
    expect(p.get("login")).toBe("my-login");
    expect(p.get("time")).toBeTruthy();
    expect(p.get("sul")).toBeTruthy();
    expect(p.get("auth")).toBeTruthy();
    // E.164 → digits only, '+' stripped.
    expect(p.get("number")).toBe("420777123456");
    expect(p.get("number")).not.toContain("+");
    expect(p.get("message")).toBe(MSG.text);
    // The raw password must never be transmitted — only the auth digest.
    expect([...p.values()]).not.toContain("s3cret-pass");
  });

  it("formats time as smsbrana's YYYYMMDD'T'HHmmss in Europe/Prague wall-clock (summer = UTC+2) and uses a fresh salt per send", async () => {
    vi.useFakeTimers();
    // 14:30 UTC on 2026-06-05 is CEST (UTC+2) → 16:30 Prague wall-clock.
    vi.setSystemTime(new Date("2026-06-05T14:30:00.000Z"));
    const { calls } = stubFetch(okXml());
    const provider = new SmsbranaProvider("my-login", "s3cret-pass");

    await provider.send(RECIPIENT, MSG);
    await provider.send(RECIPIENT, MSG);

    // smsbrana validates `time` against its Europe/Prague server clock (err=4 if
    // out of window), so we MUST emit Prague local time, not UTC.
    expect(calls[0]!.params.get("time")).toBe("20260605T163000");
    // salt is random per request (replay protection)
    expect(calls[0]!.params.get("sul")).not.toBe(calls[1]!.params.get("sul"));
    vi.useRealTimers();
  });

  it("emits WINTER Prague wall-clock too (CET = UTC+1) for a fixed injected instant", async () => {
    vi.useFakeTimers();
    // 14:30 UTC on 2026-01-15 is CET (UTC+1) → 15:30 Prague wall-clock (DST off).
    vi.setSystemTime(new Date("2026-01-15T14:30:00.000Z"));
    const { calls } = stubFetch(okXml());
    const provider = new SmsbranaProvider("my-login", "s3cret-pass");

    await provider.send(RECIPIENT, MSG);

    expect(calls[0]!.params.get("time")).toBe("20260115T153000");
    vi.useRealTimers();
  });
});

describe("SmsbranaProvider — XML parsing", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("extracts sms_id, sms_count→segments, price, credit from a success response", async () => {
    stubFetch(okXml({ sms_id: "555", sms_count: "4", price: "2.40", credit: "100.00" }));
    const provider = new SmsbranaProvider("login", "pass");

    const res = await provider.send(RECIPIENT, MSG);

    expect(res.providerMessageId).toBe("555");
    expect(res.segments).toBe(4);
    expect(res.price).toBe(2.4);
    expect(res.credit).toBe(100);
  });

  it("throws when err != 0 (surfacing the numeric code)", async () => {
    stubFetch(okXml({ err: "9" })); // 9 = insufficient credit
    const provider = new SmsbranaProvider("login", "pass");
    await expect(provider.send(RECIPIENT, MSG)).rejects.toThrow(/err=9/);
  });

  it("throws on a success response with no sms_id", async () => {
    // err=0 but the id tag is absent.
    const xml = `<?xml version="1.0"?><result><err>0</err><sms_count>1</sms_count></result>`;
    stubFetch(xml);
    const provider = new SmsbranaProvider("login", "pass");
    await expect(provider.send(RECIPIENT, MSG)).rejects.toThrow(/missing sms_id/);
  });
});

describe("SmsbranaProvider — number normalization (FIX 3)", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("strips a leading international '00' prefix (00420… → 420…)", async () => {
    const { calls } = stubFetch(okXml());
    const provider = new SmsbranaProvider("login", "pass");

    await provider.send({ channel: "sms", address: "00420777123456" }, MSG);

    expect(calls[0]!.params.get("number")).toBe("420777123456");
  });

  it("still strips a leading '+' (+420… → 420…)", async () => {
    const { calls } = stubFetch(okXml());
    const provider = new SmsbranaProvider("login", "pass");

    await provider.send({ channel: "sms", address: "+420777123456" }, MSG);

    expect(calls[0]!.params.get("number")).toBe("420777123456");
  });

  it("handles a spaced/parenthesised '00' number (00 420 777… → 420777…)", async () => {
    const { calls } = stubFetch(okXml());
    const provider = new SmsbranaProvider("login", "pass");

    await provider.send({ channel: "sms", address: "00 420 777 123 456" }, MSG);

    expect(calls[0]!.params.get("number")).toBe("420777123456");
  });
});

describe("SmsbranaProvider — XML extraction edge cases (FIX 1, ReDoS-safe)", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("trims whitespace: <err> 0 </err> is read as success '0'", async () => {
    // err=0 with padding inside the tag → must NOT throw, must succeed.
    const xml = `<?xml version="1.0"?><result><err> 0 </err><sms_id> 555 </sms_id></result>`;
    stubFetch(xml);
    const provider = new SmsbranaProvider("login", "pass");

    const res = await provider.send(RECIPIENT, MSG);
    expect(res.providerMessageId).toBe("555");
  });

  it("a MISSING close tag does NOT hang and yields null (treated as a failed send)", async () => {
    // The old [\s\S]*? regex backtracked catastrophically here; the linear
    // [^<]* version returns null fast → err !== '0' path → throws cleanly.
    const xml = `<?xml version="1.0"?><result><err>0<sms_id>555</sms_id></result>`;
    stubFetch(xml);
    const provider = new SmsbranaProvider("login", "pass");

    // <err> never closes → extractTag returns null → err !== "0" → throw.
    await expect(provider.send(RECIPIENT, MSG)).rejects.toThrow(/err=\?/);
  });

  it("rejects an absurdly large (>64KB) response as malformed before deep parsing", async () => {
    // A pathological body: a huge run with no close tag would be the ReDoS vector.
    const huge = `<?xml version="1.0"?><result><err>0` + "x".repeat(70 * 1024);
    stubFetch(huge);
    const provider = new SmsbranaProvider("login", "pass");

    await expect(provider.send(RECIPIENT, MSG)).rejects.toThrow(/too large|malformed/i);
  });
});

describe("SmsbranaProvider — Czech diacritics encoding (corr-04)", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("sets data_code=ucs2 so Czech diacritics send as Unicode (gateway must not transliterate)", async () => {
    const { calls } = stubFetch(okXml());
    const provider = new SmsbranaProvider("login", "pass");

    // Message with the full range of Czech háčky/čárky.
    await provider.send(RECIPIENT, { text: "Příliš žluťoučký kůň úpěl ďábelské ódy" });

    const p = calls[0]!.params;
    // smsbrana data_code default is "7bit" (GSM-7) which strips/garbles diacritics;
    // "ucs2" is the documented Unicode value for "s diakritikou / spec. znaky".
    expect(p.get("data_code")).toBe("ucs2");
    // The body is transmitted intact (URLSearchParams percent-encodes on the wire,
    // but the decoded value must equal the original diacritic text).
    expect(p.get("message")).toBe("Příliš žluťoučký kůň úpěl ďábelské ódy");
  });
});

describe("SmsbranaProvider — failover is transport-only (FIX 4)", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("retries the BACKUP host on a genuine fetch rejection (TypeError)", async () => {
    const urls: string[] = [];
    const fetchSpy = vi.fn(async (url: string, init?: { body?: string }) => {
      urls.push(url);
      if (urls.length === 1) {
        // Genuine transport failure — fetch rejects with a TypeError.
        throw new TypeError("fetch failed");
      }
      return { ok: true, status: 200, text: async () => okXml() } as unknown as Response;
      void init;
    });
    vi.stubGlobal("fetch", fetchSpy);
    const provider = new SmsbranaProvider("login", "pass");

    const res = await provider.send(RECIPIENT, MSG);

    expect(res.providerMessageId).toBe("987654");
    expect(urls).toHaveLength(2);
    expect(urls[0]).toContain("api.smsbrana.cz");
    expect(urls[1]).toContain("api-backup.smsbrana.cz");
    // Idempotency: the SAME sul is replayed so smsbrana err=5 blocks a double charge.
    const p1 = new URLSearchParams((fetchSpy.mock.calls[0]![1] as { body: string }).body);
    const p2 = new URLSearchParams((fetchSpy.mock.calls[1]![1] as { body: string }).body);
    expect(p2.get("sul")).toBe(p1.get("sul"));
    expect(p2.get("time")).toBe(p1.get("time"));
    expect(p2.get("auth")).toBe(p1.get("auth"));
  });

  it("treats a request TIMEOUT (AbortError) as transport → retries the BACKUP host with the same sul", async () => {
    const urls: string[] = [];
    const fetchSpy = vi.fn(async (url: string, init?: { body?: string; signal?: AbortSignal }) => {
      urls.push(url);
      if (urls.length === 1) {
        // Simulate AbortSignal.timeout firing: fetch rejects with an AbortError.
        const err = new Error("The operation was aborted due to timeout");
        err.name = "AbortError";
        throw err;
      }
      return { ok: true, status: 200, text: async () => okXml() } as unknown as Response;
      void init;
    });
    vi.stubGlobal("fetch", fetchSpy);
    const provider = new SmsbranaProvider("login", "pass");

    const res = await provider.send(RECIPIENT, MSG);

    expect(res.providerMessageId).toBe("987654");
    expect(urls).toHaveLength(2);
    expect(urls[0]).toContain("api.smsbrana.cz");
    expect(urls[1]).toContain("api-backup.smsbrana.cz");
    // Same sul replayed → smsbrana err=5 blocks a double charge if the primary went through.
    const p1 = new URLSearchParams((fetchSpy.mock.calls[0]![1] as { body: string }).body);
    const p2 = new URLSearchParams((fetchSpy.mock.calls[1]![1] as { body: string }).body);
    expect(p2.get("sul")).toBe(p1.get("sul"));
  });

  it("passes an AbortSignal to fetch (request is time-bounded)", async () => {
    const signals: (AbortSignal | undefined)[] = [];
    const fetchSpy = vi.fn(async (_url: string, init?: { signal?: AbortSignal; body?: string }) => {
      signals.push(init?.signal);
      return { ok: true, status: 200, text: async () => okXml() } as unknown as Response;
    });
    vi.stubGlobal("fetch", fetchSpy);
    const provider = new SmsbranaProvider("login", "pass");

    await provider.send(RECIPIENT, MSG);

    expect(signals[0]).toBeInstanceOf(AbortSignal);
  });

  it("does NOT retry the backup host on a non-2xx HTTP status (no duplicate send)", async () => {
    const urls: string[] = [];
    const fetchSpy = vi.fn(async (url: string) => {
      urls.push(url);
      // Reached the host but it answered 500 — the request may have processed.
      return { ok: false, status: 500, text: async () => "" } as unknown as Response;
    });
    vi.stubGlobal("fetch", fetchSpy);
    const provider = new SmsbranaProvider("login", "pass");

    await expect(provider.send(RECIPIENT, MSG)).rejects.toThrow(/HTTP 500/);
    // Crucially: only the PRIMARY host was contacted — no backup resend.
    expect(urls).toHaveLength(1);
    expect(urls[0]).toContain("api.smsbrana.cz");
    expect(urls[0]).not.toContain("api-backup");
  });
});

describe("createSmsProvider — NOOP path when env unset", () => {
  const realLogin = process.env.SMSBRANA_LOGIN;
  const realPass = process.env.SMSBRANA_PASSWORD;

  beforeEach(() => {
    delete process.env.SMSBRANA_LOGIN;
    delete process.env.SMSBRANA_PASSWORD;
  });
  afterEach(() => {
    if (realLogin === undefined) delete process.env.SMSBRANA_LOGIN;
    else process.env.SMSBRANA_LOGIN = realLogin;
    if (realPass === undefined) delete process.env.SMSBRANA_PASSWORD;
    else process.env.SMSBRANA_PASSWORD = realPass;
    vi.unstubAllGlobals();
  });

  it("returns a noop provider that does NOT call fetch and yields a synthetic id", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const provider = createSmsProvider();
    const res = await provider.send(RECIPIENT, MSG);

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(res.providerMessageId).toMatch(/^noop-sms-/);
  });

  it("returns the LIVE provider once both credentials are set", () => {
    process.env.SMSBRANA_LOGIN = "login";
    process.env.SMSBRANA_PASSWORD = "pass";
    expect(createSmsProvider()).toBeInstanceOf(SmsbranaProvider);
  });
});
