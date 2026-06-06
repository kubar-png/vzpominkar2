import type { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit } from "@/lib/rate-limit";
import { SITE_HOST } from "@/lib/site";

/**
 * Senior opt-out + just-in-time Art. 14 notice — /odhlasit/{token}?kanal=sms|whatsapp.
 *
 * Every SMS / WhatsApp weekly-question carries this link (the EXACT contract:
 * `${appUrl}/odhlasit/${magic_token}?kanal=sms|whatsapp`, built in
 * lib/messaging/dispatch.ts + lib/messaging/render.ts). The CZ alphanumeric SMS
 * sender is one-way, so "STOP" cannot work — opting out MUST be a link.
 *
 * Legal framing. The weekly question is a SERVICE message sent on the basis of
 * GDPR Art. 6(1)(f) legitimate interest (NOT consent). The senior is a third
 * party whose number the BUYER provided, so this landing doubles as the Art. 14
 * just-in-time notice: who we are, that a family member gave the number, why we
 * write, the legal basis, and how to stop in one tap. See
 * docs/legal/2026-06-06-LIA-sms-whatsapp.md.
 *
 * No session. Unlike /q/{token} (the magic LOGIN link), this page NEVER signs
 * the senior in — it only records the opt-out. The token is looked up via the
 * service-role admin client (the senior is not authenticated). To avoid a link
 * prefetcher / email scanner / antivirus silently unsubscribing the senior, the
 * GET only RENDERS the notice; the opt-out itself is the explicit "Odhlásit
 * odběr" button (a POST Server Action below).
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Never index a token landing page.
export const metadata: Metadata = {
  title: "Odhlášení odběru — Vzpomínkář",
  robots: { index: false, follow: false },
};

const NAVY = "#0e3b64";
const CREAM = "#faf6ec";
const OXBLOOD = "#a8231f";
const INK_SOFT = "rgba(14,59,100,0.72)";

/** The two channels a message can be sent on; the only valid `kanal` values. */
type Kanal = "sms" | "whatsapp";

/** Same shape the message renderer / dispatch validate against. */
const TOKEN_RE = /^[a-f0-9]{32,128}$/;

function parseKanal(raw: string | undefined): Kanal | null {
  return raw === "sms" || raw === "whatsapp" ? raw : null;
}

function kanalLabel(kanal: Kanal): string {
  return kanal === "whatsapp" ? "WhatsApp" : "SMS";
}

type SeniorRow = {
  id: string;
  display_name: string | null;
  sms_opt_out_at: string | null;
  whatsapp_opt_out_at: string | null;
};

/** Look the senior up by their stable magic token (role = senior). */
async function findSenior(token: string): Promise<SeniorRow | null> {
  if (!TOKEN_RE.test(token)) return null;
  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("id, display_name, sms_opt_out_at, whatsapp_opt_out_at")
    .eq("magic_token", token)
    .eq("role", "senior")
    .maybeSingle<SeniorRow>();
  return data ?? null;
}

/**
 * One-tap opt-out (POST). Validates the token + kanal again on the server (a
 * form value can be tampered with), then stamps the matching {sms|whatsapp}_
 * opt_out_at via the service-role client. Idempotent: a second tap keeps the
 * first timestamp. No session is created.
 */
async function optOut(formData: FormData): Promise<void> {
  "use server";
  const token = String(formData.get("token") ?? "");
  const kanal = parseKanal(String(formData.get("kanal") ?? "") || undefined);
  if (!TOKEN_RE.test(token) || !kanal) return;

  // Light per-IP throttle (fail-open — a senior must never be blocked from
  // stopping messages). Reuses the `magic` limiter bucket.
  await checkRateLimit("magic", "odhlasit");

  const senior = await findSenior(token);
  if (!senior) return;

  const already = kanal === "sms" ? senior.sms_opt_out_at : senior.whatsapp_opt_out_at;
  if (already) return; // already opted out — keep the original timestamp

  // Build a statically-typed patch so the typed client accepts the column (a
  // computed `{ [column]: ... }` key widens to a string index it rejects).
  const now = new Date().toISOString();
  const patch =
    kanal === "sms" ? { sms_opt_out_at: now } : { whatsapp_opt_out_at: now };

  const admin = createAdminClient();
  await admin
    .from("profiles")
    .update(patch)
    .eq("id", senior.id)
    .eq("role", "senior");
}

export default async function OdhlasitPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ kanal?: string }>;
}) {
  const { token } = await params;
  const { kanal: kanalRaw } = await searchParams;
  const kanal = parseKanal(kanalRaw);

  // Invalid token OR missing/invalid kanal → a calm, non-revealing screen. We
  // never disclose whether the token matched a real senior.
  if (!TOKEN_RE.test(token) || !kanal) {
    return <NotAvailable />;
  }

  const senior = await findSenior(token);
  if (!senior) {
    return <NotAvailable />;
  }

  const channelLabel = kanalLabel(kanal);
  const alreadyOut =
    kanal === "sms" ? Boolean(senior.sms_opt_out_at) : Boolean(senior.whatsapp_opt_out_at);

  // After the opt-out Server Action stamps *_opt_out_at, the page re-renders and
  // this fresh read sees the timestamp → the confirmation. It also covers the
  // case where the senior re-opens the link after already opting out.
  if (alreadyOut) {
    return <Confirmation channelLabel={channelLabel} />;
  }

  return (
    <Notice
      token={token}
      kanal={kanal}
      channelLabel={channelLabel}
      seniorName={senior.display_name}
    />
  );
}

/* ── Notice + opt-out (the Art. 14 just-in-time notice) ─────────────────────── */

function Notice({
  token,
  kanal,
  channelLabel,
  seniorName,
}: {
  token: string;
  kanal: Kanal;
  channelLabel: string;
  seniorName: string | null;
}) {
  const name = seniorName?.trim() || null;
  return (
    <Page>
      <Eyebrow>Odhlášení odběru</Eyebrow>
      <h1 style={{ fontSize: 25, lineHeight: 1.25, fontWeight: 500, margin: "0 0 16px" }}>
        {name ? <>{name}, posíláme vám týdenní otázky na vzpomínání</> : <>Týdenní otázky na vzpomínání</>}
      </h1>

      <p style={{ fontSize: 17, lineHeight: 1.7, margin: "0 0 16px" }}>
        Jsme <strong>Vzpomínkář</strong> &mdash; služba, která pomáhá rodinám zachytit
        vzpomínky jejich blízkých. Jednou týdně vám na toto číslo posíláme přes{" "}
        {channelLabel} jednu otázku k zavzpomínání. Odpověď stačí nahrát hlasem,
        rodina si ji uloží do společné knihy.
      </p>

      <p style={{ fontSize: 17, lineHeight: 1.7, margin: "0 0 16px" }}>
        Vaše telefonní číslo nám poskytl někdo z vaší rodiny, kdo vás do Vzpomínkáře
        přidal &mdash; ne my. Otázky vám posíláme na základě{" "}
        <strong>oprávněného zájmu</strong> rodiny zaznamenat vaše vyprávění (čl. 6
        odst. 1 písm. f) GDPR); nejde o reklamu. Zpracováváme jen vaše jméno a toto
        jedno telefonní číslo &mdash; nic víc.
      </p>

      <p style={{ fontSize: 17, lineHeight: 1.7, margin: "0 0 24px" }}>
        Pokud si otázky posílat nepřejete, můžete odběr kdykoliv zastavit jediným
        klepnutím. Žádné další zprávy vám už nepřijdou.
      </p>

      <form action={optOut}>
        <input type="hidden" name="token" value={token} />
        <input type="hidden" name="kanal" value={kanal} />
        <button
          type="submit"
          style={{
            display: "block",
            width: "100%",
            padding: "16px 20px",
            fontFamily: "Arial, Helvetica, sans-serif",
            fontSize: 17,
            fontWeight: 600,
            color: CREAM,
            background: OXBLOOD,
            border: "none",
            borderRadius: 10,
            cursor: "pointer",
          }}
        >
          Odhlásit odběr {channelLabel}
        </button>
      </form>

      <p style={{ fontSize: 14, color: INK_SOFT, lineHeight: 1.6, margin: "20px 0 0" }}>
        Chcete naopak ve vyprávění pokračovat? Pak nemusíte dělat nic &mdash; tuto
        stránku stačí zavřít.
      </p>

      <Legal />
    </Page>
  );
}

/* ── Confirmation (after opt-out, or already opted out) ─────────────────────── */

function Confirmation({ channelLabel }: { channelLabel: string }) {
  return (
    <Page>
      <Eyebrow>Hotovo</Eyebrow>
      <h1 style={{ fontSize: 25, lineHeight: 1.25, fontWeight: 500, margin: "0 0 16px" }}>
        Odběr je zrušený
      </h1>
      <p style={{ fontSize: 17, lineHeight: 1.7, margin: "0 0 16px" }}>
        Děkujeme. Žádné další otázky vám přes {channelLabel} posílat nebudeme. Nic
        dalšího není potřeba dělat &mdash; tuto stránku můžete zavřít.
      </p>
      <p style={{ fontSize: 15, color: INK_SOFT, lineHeight: 1.7, margin: 0 }}>
        Kdybyste si to rozmysleli, řekněte o tom někomu z rodiny, kdo vás do
        Vzpomínkáře přidal &mdash; rád/ráda vám posílání otázek zase zapne.
      </p>
      <Legal />
    </Page>
  );
}

/* ── Shared chrome ──────────────────────────────────────────────────────────── */

function Page({ children }: { children: React.ReactNode }) {
  return (
    <main
      style={{
        minHeight: "100dvh",
        background: CREAM,
        color: NAVY,
        fontFamily: "Georgia, 'Times New Roman', serif",
        display: "flex",
        justifyContent: "center",
        padding: "40px 20px 56px",
      }}
    >
      <article style={{ width: "100%", maxWidth: 540 }}>{children}</article>
    </main>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: 11,
        letterSpacing: "0.32em",
        textTransform: "uppercase",
        color: OXBLOOD,
        margin: "0 0 6px",
      }}
    >
      {children}
    </p>
  );
}

/** Footer with the controller identity + a link to the full privacy notice. */
function Legal() {
  return (
    <footer style={{ borderTop: "1px solid rgba(14,59,100,0.15)", marginTop: 32, paddingTop: 16 }}>
      <p style={{ fontSize: 13, color: INK_SOFT, lineHeight: 1.6, margin: 0 }}>
        Správcem údajů je <strong style={{ color: NAVY }}>Vzpomínkář, s. r. o.</strong>{" "}
        Více o tom, jak s vaším telefonním číslem nakládáme a jaká máte práva, najdete
        v{" "}
        <Link
          href="/soukromi"
          style={{ color: OXBLOOD, textDecoration: "underline", textUnderlineOffset: 4 }}
        >
          zásadách ochrany soukromí
        </Link>{" "}
        na {SITE_HOST}.
      </p>
    </footer>
  );
}

function NotAvailable() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        background: CREAM,
        color: NAVY,
        fontFamily: "Georgia, 'Times New Roman', serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "32px 24px",
      }}
    >
      <h1 style={{ fontSize: 24, fontWeight: 500, margin: "0 0 10px" }}>Odkaz není platný</h1>
      <p style={{ fontSize: 15, color: INK_SOFT, maxWidth: 420, margin: 0, lineHeight: 1.6 }}>
        Tento odkaz na odhlášení se nepodařilo otevřít &mdash; možná není úplný.
        Zkuste prosím klepnout přímo na odkaz z poslední zprávy, kterou jsme vám
        poslali.
      </p>
    </main>
  );
}
