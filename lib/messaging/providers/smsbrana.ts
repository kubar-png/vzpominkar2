import "server-only";
import { createHash, randomUUID } from "node:crypto";
import type {
  ChannelProvider,
  DeliveryRecipient,
  RenderedMessage,
  SendResult,
} from "@/lib/messaging/types";

/**
 * SMS ChannelProvider — smsbrana.cz "SMS Connect" HTTP API.
 *
 * Mirrors the lib/email/provider.ts NoopProvider pattern: when SMSBRANA_LOGIN or
 * SMSBRANA_PASSWORD is unset the provider is a NOOP (logs the intended send in
 * non-production, returns a synthetic id) so the whole pipeline is testable in
 * preview before a real account exists.
 *
 * Wire format (spec §4.1; confirm against the live smsbrana docs once an account
 * exists — the exact `time` format and the err-code table below are the bits
 * most likely to drift):
 *   - Endpoint:  https://api.smsbrana.cz/smsconnect/http.php
 *   - Failover:  https://api-backup.smsbrana.cz/smsconnect/http.php
 *   - Secure auth (the password is NEVER transmitted):
 *       time = current time as "YYYYMMDD'T'HHmmss" (e.g. 20260605T143000)
 *       sul  = a fresh random salt per request (crypto.randomUUID())
 *       auth = md5(SMSBRANA_PASSWORD + time + sul)
 *     We send login, time, sul, auth — never the password or the auth inputs.
 *   - Params: action=send_sms, number (E.164 WITHOUT '+', e.g. 420777123456),
 *     message (UTF-8, diacritics kept), optional sender_id, delivery_report=1.
 *   - Response: XML rooted in <result> with <err> (0 = success), <sms_id>,
 *     <sms_count> (billed segments), <price>, <credit> (remaining balance).
 *     err != 0 → throw (message includes the code); success → return the result.
 *
 * SECURITY: never log SMSBRANA_PASSWORD, the auth hash, or full credentials.
 */

const PRIMARY_HOST = "https://api.smsbrana.cz/smsconnect/http.php";
const BACKUP_HOST = "https://api-backup.smsbrana.cz/smsconnect/http.php";

/**
 * Per-request network timeout. The send runs inside a sequential maxDuration=300
 * cron; without a cap, ONE hung socket (TCP accepted, no response — neither a
 * fetch rejection nor a non-2xx) would `await` indefinitely, consume the whole
 * 300 s budget, and leave every remaining senior that week un-reminded. We abort
 * after this many ms and classify the abort as a transport failure so the
 * existing backup-host failover fires (see isTransportError / post()).
 */
const REQUEST_TIMEOUT_MS = 8000;

/** A reached-host non-2xx error — carries a marker so it is NOT treated as a
 * transport failure (and therefore NEVER triggers the backup-host resend). */
interface SmsbranaHttpError extends Error {
  isHttpStatusError?: boolean;
}

/**
 * True for a genuine network/transport failure that means the request very likely
 * NEVER reached the gateway, so the backup host may be retried with the SAME params:
 *   - a `fetch` rejection (platform surfaces it as a TypeError: "fetch failed"), or
 *   - our own request TIMEOUT (AbortError / DOMException name "AbortError", or any
 *     error whose name is "TimeoutError") — a hung socket we gave up on.
 *
 * A non-2xx HTTP status (SmsbranaHttpError) is explicitly NOT a transport error: the
 * request reached the server and may have sent/billed, so it must not be retried.
 * On the transport retry we replay the SAME `sul`, so even if a timed-out primary
 * DID go through, smsbrana rejects the replay with err=5 — guarding against a
 * duplicate charge.
 */
function isTransportError(e: unknown): boolean {
  if (e && (e as SmsbranaHttpError).isHttpStatusError) return false;
  if (e instanceof TypeError) return true;
  const name = (e as { name?: string } | null)?.name;
  return name === "AbortError" || name === "TimeoutError";
}

/**
 * smsbrana err codes (confirm against live docs once an account exists):
 *   0  ok
 *   1  unknown error
 *   2  invalid login
 *   3  invalid hash / salt (auth)
 *   4  invalid time
 *   5  salt already used (replay)
 *   6  action not allowed / unsupported
 *   7  message too long / invalid
 *   8  network/connection error (provider side)
 *   9  insufficient credit
 *  10  invalid recipient number
 *  11  sender_id not approved
 * Only the numeric code is authoritative; surface it verbatim in the thrown error.
 */
const ERR_HINTS: Record<string, string> = {
  "2": "invalid login",
  "3": "invalid auth hash/salt",
  "4": "invalid time",
  "5": "salt already used (replay)",
  "9": "insufficient credit",
  "10": "invalid recipient number",
  "11": "sender_id not approved",
};

/**
 * Format a Date as smsbrana's "YYYYMMDD'T'HHmmss" in **Europe/Prague** local time.
 *
 * smsbrana validates the `time` param against its own server clock (Europe/Prague)
 * within a tolerance window and rejects out-of-window requests with err=4. Emitting
 * UTC here drifts by 1–2 h (CET/CEST) and would fail every live send. We derive the
 * Prague wall-clock parts via Intl.DateTimeFormat (DST-correct) and assemble the
 * fixed shape from them.
 *
 * NOTE: confirm the exact `time` format AND timezone against the live smsbrana docs
 * once a real account exists — these are the bits most likely to have drifted.
 */
function formatSmsbranaTime(d: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Prague",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";
  // Intl can emit "24" for midnight under some engines — normalize to "00".
  const hour = get("hour") === "24" ? "00" : get("hour");
  return (
    `${get("year")}${get("month")}${get("day")}` +
    `T${hour}${get("minute")}${get("second")}`
  );
}

/**
 * Largest smsbrana response we'll parse. The real response is a few hundred
 * bytes; anything beyond this is a malformed/hostile body and is rejected before
 * the regex runs (defence-in-depth against pathological input).
 */
const MAX_XML_LEN = 64 * 1024;

/**
 * Extract the inner text of the first <tag>…</tag> from an XML string.
 *
 * Deliberately dependency-free (no XML parser) — the smsbrana response is a flat,
 * well-known shape. The content class `[^<]*` is LINEAR and, crucially, cannot
 * span a missing close tag (an earlier `[\s\S]*?` version backtracked
 * catastrophically — a ReDoS — when </tag> was absent). Returns null when the tag
 * is absent. Whitespace around the value is trimmed, so `<err> 0 </err>` → "0".
 */
function extractTag(xml: string, tag: string): string | null {
  const m = new RegExp(`<${tag}>([^<]*)</${tag}>`, "i").exec(xml);
  return m ? (m[1] ?? "").trim() : null;
}

/**
 * Recipient E.164 → smsbrana `number` (digits only, no leading '+' and no leading
 * international '00' prefix).
 *
 * Strips every non-digit (so "+420…" → "420…"), then collapses a leading "00"
 * international prefix ("00420…" → "420…") which the digit strip alone leaves
 * intact. smsbrana wants the bare country-code-prefixed MSISDN, e.g. 420777123456.
 */
function toSmsbranaNumber(address: string): string {
  const digits = address.replace(/[^\d]/g, "");
  return digits.startsWith("00") ? digits.slice(2) : digits;
}

class NoopSmsProvider implements ChannelProvider {
  readonly channel = "sms" as const;
  /** Noop: credentials are unset. Dispatch must fall back to email in prod. */
  readonly isLive = false;

  async send(to: DeliveryRecipient, msg: RenderedMessage): Promise<SendResult> {
    if (process.env.NODE_ENV !== "production") {
      console.log(
        `[sms:noop] would send to ${to.address}: ${JSON.stringify(msg.text.slice(0, 80))}…`,
      );
    }
    return { providerMessageId: `noop-sms-${Date.now()}` };
  }
}

class SmsbranaProvider implements ChannelProvider {
  readonly channel = "sms" as const;
  /** Credential-backed live provider — a real SMS is sent and billed. */
  readonly isLive = true;
  private login: string;
  private password: string;
  private senderId?: string;

  constructor(login: string, password: string, senderId?: string) {
    this.login = login;
    this.password = password;
    this.senderId = senderId;
  }

  private buildParams(to: DeliveryRecipient, msg: RenderedMessage): URLSearchParams {
    const time = formatSmsbranaTime(new Date());
    const sul = randomUUID();
    // Secure auth: md5(password + time + sul). The password and this hash input
    // are never logged or transmitted; only the resulting `auth` digest is sent.
    const auth = createHash("md5").update(this.password + time + sul).digest("hex");

    const params = new URLSearchParams({
      action: "send_sms",
      login: this.login,
      time,
      sul,
      auth,
      number: toSmsbranaNumber(to.address),
      message: msg.text,
      // Force UCS-2 encoding so Czech diacritics send intact. smsbrana's SMS
      // Connect `data_code` defaults to "7bit" (GSM-7), under which the gateway
      // transliterates/garbles háčky & čárky (ě š č ř ž ý á í é → ? or stripped).
      // "ucs2" is the documented value for "s diakritikou / spec. znaky" (70-char
      // segments), which also matches our estimateSmsSegments() UCS-2 assumption.
      // Source: smsbrana SMS Connect docs, send_sms → data_code ("7bit" default | "ucs2").
      data_code: "ucs2",
      delivery_report: "1",
    });
    if (this.senderId) params.set("sender_id", this.senderId);
    return params;
  }

  private async post(host: string, params: URLSearchParams): Promise<string> {
    // Bound the request so a hung socket can't stall the whole sequential cron.
    // The abort surfaces as a TimeoutError/AbortError, which isTransportError()
    // classifies as transport → send() fails over to the backup host (replaying
    // the same `sul`, so a primary that secretly went through is blocked by err=5).
    const res = await fetch(host, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!res.ok) {
      // A reached-but-non-2xx host. This is NOT a transport failure: the request
      // may have been processed (and an SMS billed), so it must NOT trigger the
      // backup-host retry below. The marker flag lets send() distinguish it from
      // a genuine fetch rejection.
      const err = new Error(`smsbrana HTTP ${res.status}`) as SmsbranaHttpError;
      err.isHttpStatusError = true;
      throw err;
    }
    return res.text();
  }

  async send(to: DeliveryRecipient, msg: RenderedMessage): Promise<SendResult> {
    const params = this.buildParams(to, msg);

    // Fail over to the backup host on a genuine network/transport error ONLY (a
    // `fetch` rejection, which surfaces as a TypeError). A reached host that
    // returns a non-2xx status, or a 2xx with a non-zero <err>, is an application
    // outcome — the request may already have sent/billed, so retrying it on the
    // backup host risks a DUPLICATE send. On the transport retry we deliberately
    // reuse the SAME params (same time + sul + auth): smsbrana rejects a reused
    // `sul` with err=5, which is exactly the replay/idempotency guard that
    // prevents a duplicate charge if the primary actually went through.
    let xml: string;
    try {
      xml = await this.post(PRIMARY_HOST, params);
    } catch (e) {
      if (!isTransportError(e)) throw e;
      xml = await this.post(BACKUP_HOST, params);
    }

    if (xml.length > MAX_XML_LEN) {
      throw new Error(
        `smsbrana send: response too large (${xml.length} bytes) — treating as malformed`,
      );
    }

    const errRaw = extractTag(xml, "err");
    if (errRaw !== "0") {
      const code = errRaw ?? "?";
      const hint = ERR_HINTS[code] ? ` (${ERR_HINTS[code]})` : "";
      throw new Error(`smsbrana send failed: err=${code}${hint}`);
    }

    const smsId = extractTag(xml, "sms_id");
    if (!smsId) {
      throw new Error("smsbrana send: missing sms_id in a success response");
    }
    const segments = extractTag(xml, "sms_count");
    const price = extractTag(xml, "price");
    const credit = extractTag(xml, "credit");

    return {
      providerMessageId: smsId,
      segments: segments != null ? Number(segments) : undefined,
      price: price != null ? Number(price) : undefined,
      credit: credit != null ? Number(credit) : undefined,
    };
  }
}

/**
 * Build the SMS provider for the messaging registry. Returns the live smsbrana
 * provider when both credentials are present, otherwise a noop — mirroring
 * getEmailProvider().
 */
export function createSmsProvider(): ChannelProvider {
  const login = process.env.SMSBRANA_LOGIN;
  const password = process.env.SMSBRANA_PASSWORD;
  if (!login || !password) {
    return new NoopSmsProvider();
  }
  return new SmsbranaProvider(login, password, process.env.SMSBRANA_SENDER_ID);
}

export { SmsbranaProvider, NoopSmsProvider };
