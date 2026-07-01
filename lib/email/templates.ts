import "server-only";
import { resolveGender, type Gender } from "@/lib/gender";
import { SITE_URL } from "@/lib/site";

/**
 * Transactional email templates — editorial brand.
 *
 * Design rules (mirrors marketing site, simplified for email clients):
 *   • Off-white backdrop (#FEF7D7), paper-card body (#FFFDF3) with soft shadow.
 *   • Display headings → Bree Serif stack (email can't load webfonts, so this
 *     falls back to Georgia — the closest web-safe serif).
 *   • Body type   → system sans stack at 1.6 leading.
 *   • CTA         → raspberry pill (#CF364C), white text, trailing ↗.
 *   • Footer      → tiny editorial line + tagline "Psáno i vyprávěno".
 *
 * Inlined styles are intentional — most clients strip <style>/<link>.
 * Outlook-safe: nested 600px <table> layout, no flex, no CSS variables.
 *
 * Every render() returns { subject, html, text }. The text fallback is
 * mandatory — corporate inboxes routinely hide HTML.
 *
 * Czech copy throughout. Warm "vykání" for owners; gentler register +
 * larger type for seniors.
 */

/* -------------------------------------------------------------------------- */
/* Palette                                                                    */
/* -------------------------------------------------------------------------- */

const CREAM = "#FEF7D7";
const PAPER = "#FFFDF3";
const INK = "#1B2E4D";
const INK_SOFT = "#5F6D82";
const GOLD = "#CF364C";
const OXBLOOD = "#CF364C";
const HAIRLINE = "#F1C3C9";

const DISPLAY_FONT = `"Bree Serif", Georgia, "Times New Roman", serif`;
const BODY_FONT = `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`;

/* -------------------------------------------------------------------------- */
/* Primitives                                                                 */
/* -------------------------------------------------------------------------- */

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Outer brand shell. `opts.body` is raw HTML — callers must pre-escape any user
 * input themselves.
 */
function shell(opts: {
  title: string;
  preheader?: string;
  body: string;
  /** Override the gentler reading size (used by senior-facing emails). */
  bodySize?: 16 | 18;
}): string {
  const bodySize = opts.bodySize ?? 16;
  return `<!doctype html>
<html lang="cs">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>${esc(opts.title)}</title>
</head>
<body style="margin:0;padding:0;background:${CREAM};color:${INK};font-family:${BODY_FONT};-webkit-text-size-adjust:100%;">
  ${
    opts.preheader
      ? `<div style="display:none;max-height:0;overflow:hidden;color:transparent;opacity:0;height:0;width:0;font-size:1px;line-height:1px;">${esc(opts.preheader)}</div>`
      : ""
  }
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${CREAM};">
    <tr><td align="center" style="padding:40px 16px 24px 16px;">

      <!-- Wordmark row -->
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">
        <tr>
          <td align="left" style="padding:0 8px 20px 8px;">
            <div style="font-family:${DISPLAY_FONT};font-size:26px;color:${INK};line-height:1;">Vzpomínkář</div>
          </td>
        </tr>
      </table>

      <!-- Paper card -->
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:${PAPER};border:1px solid ${HAIRLINE};border-radius:14px;box-shadow:0 1px 0 rgba(27,46,77,0.04),0 12px 30px -18px rgba(27,46,77,0.18);">
        <tr><td style="padding:36px 36px 32px 36px;font-family:${BODY_FONT};font-size:${bodySize}px;line-height:1.6;color:${INK};">
          ${opts.body}
        </td></tr>
      </table>

      <!-- Footer -->
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;margin-top:24px;">
        <tr><td style="padding:0 8px;">
          <div style="height:1px;background:${HAIRLINE};margin:0 0 16px 0;line-height:1px;font-size:1px;">&nbsp;</div>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td align="left" style="font-family:${BODY_FONT};font-size:11px;color:${INK_SOFT};letter-spacing:0.04em;">
                Vzpomínkář &middot; Praha &middot; <a href="mailto:ahoj@vzpominkar.com" style="color:${INK_SOFT};text-decoration:none;">ahoj@vzpominkar.com</a>
              </td>
              <td align="right" style="font-family:${DISPLAY_FONT};font-size:11px;color:${INK_SOFT};letter-spacing:0.08em;">
                Psáno i vyprávěno
              </td>
            </tr>
          </table>
        </td></tr>
      </table>

    </td></tr>
  </table>
</body>
</html>`;
}

/** Raspberry pill CTA with trailing ↗. */
function cta(label: string, href: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0;"><tr><td align="center" style="background:${GOLD};border-radius:999px;mso-padding-alt:14px 28px;">
    <a href="${esc(href)}" style="display:inline-block;padding:14px 28px;font-family:${BODY_FONT};font-size:15px;font-weight:600;letter-spacing:0.01em;color:#ffffff;text-decoration:none;line-height:1;">
      ${esc(label)} <span style="opacity:0.85;">&#8599;</span>
    </a>
  </td></tr></table>`;
}

/** Display heading (Bree Serif stack, large). */
function h1(text: string, color: string = INK): string {
  return `<h1 style="margin:0 0 18px 0;font-family:${DISPLAY_FONT};font-size:30px;line-height:1.15;color:${color};font-weight:400;letter-spacing:-0.01em;">${esc(text)}</h1>`;
}

/** Soft hairline separator inside the card. */
const HR = `<div style="height:1px;background:${HAIRLINE};margin:24px 0;line-height:1px;font-size:1px;">&nbsp;</div>`;

/** Warm sign-off line. */
function signoff(name: string = "Kuba a tým Vzpomínkáře"): string {
  return `<p style="margin:24px 0 0 0;font-family:${DISPLAY_FONT};font-size:18px;color:${INK};line-height:1.3;">${esc(name)}</p>`;
}

/* -------------------------------------------------------------------------- */
/* 1. Owner welcome — after signup confirm                                    */
/* -------------------------------------------------------------------------- */

export function welcomeEmail(input: { displayName: string; appUrl: string }) {
  const subject = "Vítejte ve Vzpomínkáři";
  const firstName = (input.displayName.split(" ")[0] ?? input.displayName).trim();
  const ctaUrl = `${input.appUrl}/dashboard`;

  const html = shell({
    title: subject,
    preheader: "Pomalý začátek. Jedna otázka týdně, žádný spěch.",
    body: `
      ${h1(`Dobrý den, ${firstName}.`)}
      <p style="margin:0 0 14px 0;">
        Děkujeme, že jste se rozhodli zachytit příběh někoho blízkého. Vzpomínkář je pomalý
        nástroj &mdash; jedna otázka týdně, žádná aplikace k učení, žádný spěch.
      </p>
      <p style="margin:0 0 24px 0;">
        V dalším kroku si vytvoříte první otázku a přihlašovací lísteček pro vyprávějícího.
        Trvá to pár minut a můžete se kdykoli vrátit.
      </p>
      <p style="margin:0 0 8px 0;">${cta("Vytvořit první otázku", ctaUrl)}</p>
      ${HR}
      <p style="margin:0;font-size:14px;color:${INK_SOFT};">
        Kdykoli budete potřebovat ruku, stačí na tento e-mail odpovědět. Píše vám člověk.
      </p>
      ${signoff()}
    `,
  });

  const text = [
    `Dobrý den, ${firstName}.`,
    "",
    "Děkujeme, že jste se rozhodli zachytit příběh někoho blízkého. Vzpomínkář je pomalý nástroj — jedna otázka týdně, žádná aplikace k učení, žádný spěch.",
    "",
    "V dalším kroku si vytvoříte první otázku a přihlašovací lísteček pro vyprávějícího. Trvá to pár minut a můžete se kdykoli vrátit.",
    "",
    `Vytvořit první otázku: ${ctaUrl}`,
    "",
    "Kdykoli budete potřebovat ruku, stačí na tento e-mail odpovědět. Píše vám člověk.",
    "",
    "Kuba a tým Vzpomínkáře",
  ].join("\n");

  return { subject, html, text };
}

/* -------------------------------------------------------------------------- */
/* 2. Senior login credentials — sent to OWNER, contains creds for senior      */
/* -------------------------------------------------------------------------- */

export function seniorCredentialsEmail(input: {
  ownerDisplayName: string;
  seniorDisplayName: string;
  username: string;
  password: string;
  appUrl: string;
  familyId: string;
}) {
  const subject = `Přihlašovací lísteček pro ${input.seniorDisplayName}`;
  const ctaUrl = `${input.appUrl}/family/${input.familyId}/rodina`;
  const firstName = (input.ownerDisplayName.split(" ")[0] ?? input.ownerDisplayName).trim();

  const html = shell({
    title: subject,
    preheader: `Uživatelské jméno a heslo pro ${input.seniorDisplayName}.`,
    body: `
      ${h1(`Pro ${input.seniorDisplayName} jsme připravili přihlašovací údaje.`)}
      <p style="margin:0 0 20px 0;">
        Dobrý den, ${esc(firstName)}. Níže jsou přístupy, které vyprávějícímu předáte. Doporučujeme
        si je společně v klidu zapsat na lísteček a nalepit někam k počítači &mdash; tak je nikdy nehledá.
      </p>

      <!-- Credentials block -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px 0;background:#FEF9E3;border:1px solid ${HAIRLINE};border-radius:10px;">
        <tr><td style="padding:20px 22px;">
          <div style="font-family:${BODY_FONT};font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:${INK_SOFT};margin:0 0 4px 0;">Uživatelské jméno</div>
          <div style="font-family:'SF Mono','Menlo','Consolas',monospace;font-size:22px;color:${INK};letter-spacing:0.02em;margin:0 0 18px 0;">${esc(input.username)}</div>
          <div style="font-family:${BODY_FONT};font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:${INK_SOFT};margin:0 0 4px 0;">Heslo</div>
          <div style="font-family:'SF Mono','Menlo','Consolas',monospace;font-size:22px;color:${INK};letter-spacing:0.02em;">${esc(input.password)}</div>
        </td></tr>
      </table>

      <p style="margin:0 0 14px 0;">
        Údaje předejte v klidu a pomalu. Doporučujeme si je společně zapsat na papírový lísteček
        a nalepit ho k počítači &mdash; aby je vyprávějící nikdy nemusel hledat.
      </p>
      <p style="margin:0 0 24px 0;color:${OXBLOOD};font-size:14px;">
        Heslo si tento e-mail pamatuje &mdash; jakmile bude zapsáno, klidně zprávu smažte.
      </p>
      <p style="margin:0 0 8px 0;">${cta("Zobrazit v aplikaci", ctaUrl)}</p>
      ${HR}
      <p style="margin:0;font-size:14px;color:${INK_SOFT};">
        Pokud byste cokoli potřebovali vysvětlit, odpovězte na tento e-mail.
      </p>
      ${signoff()}
    `,
  });

  const text = [
    `Pro ${input.seniorDisplayName} jsme připravili přihlašovací údaje.`,
    "",
    `Dobrý den, ${firstName}. Níže jsou přístupy, které vyprávějícímu předáte.`,
    "",
    `Uživatelské jméno: ${input.username}`,
    `Heslo: ${input.password}`,
    "",
    "Údaje předejte v klidu a pomalu — třeba si je společně zapište na lísteček a nalepte k počítači, aby je vyprávějící nikdy nemusel hledat.",
    "",
    "Heslo si tento e-mail pamatuje — jakmile bude zapsáno, klidně zprávu smažte.",
    "",
    `Zobrazit v aplikaci: ${ctaUrl}`,
    "",
    "Kuba a tým Vzpomínkáře",
  ].join("\n");

  return { subject, html, text };
}

/* -------------------------------------------------------------------------- */
/* 3. Weekly question reminder — sent to SENIOR                                */
/* -------------------------------------------------------------------------- */

export function weeklyReminderEmail(input: {
  seniorDisplayName: string;
  question: string;
  appUrl: string;
  /**
   * The senior's magic link (/q/{token}) — one click signs them in (no password)
   * and lands them on this week's question. Falls back to /senior-login when a
   * token isn't available (or for the owner-fallback copy, which must not carry
   * the senior's personal magic link).
   */
  actionUrl?: string;
}) {
  const subject = "Tento týden vám rodina poslala otázku";
  const primaryUrl = input.actionUrl ?? `${input.appUrl}/senior-login`;

  const html = shell({
    title: subject,
    preheader: input.question,
    bodySize: 18,
    body: `
      ${h1(`Dobrý den, ${input.seniorDisplayName}.`)}
      <p style="margin:0 0 18px 0;">
        Tento týden vám rodina poslala otázku. Když si na ni vzpomenete, můžete odpovědět hlasem
        nebo písmem &mdash; jak je vám pohodlnější.
      </p>

      <blockquote style="margin:24px 0;padding:24px 26px;background:#FEF9E3;border-left:3px solid ${OXBLOOD};border-radius:8px;font-family:${DISPLAY_FONT};font-size:24px;line-height:1.35;color:${INK};">
        &bdquo;${esc(input.question)}&ldquo;
      </blockquote>

      <p style="margin:0 0 8px 0;">${cta("Odpovědět hlasem", primaryUrl)}</p>
      <p style="margin:14px 0 0 0;font-size:15px;color:${INK_SOFT};">
        Nebo napište písmem &mdash; stejným odkazem.
      </p>
      ${HR}
      <p style="margin:0;font-size:15px;color:${INK_SOFT};">
        Není kam spěchat. Stačí, když odpovíte do neděle.
      </p>
      ${signoff()}
    `,
  });

  const text = [
    `Dobrý den, ${input.seniorDisplayName}.`,
    "",
    "Tento týden vám rodina poslala otázku. Když si na ni vzpomenete, můžete odpovědět hlasem nebo písmem — jak je vám pohodlnější.",
    "",
    `„${input.question}"`,
    "",
    `Odpovědět: ${primaryUrl}`,
    "",
    "Není kam spěchat. Stačí, když odpovíte do neděle.",
    "",
    "Kuba a tým Vzpomínkáře",
  ].join("\n");

  return { subject, html, text };
}

/* -------------------------------------------------------------------------- */
/* 4. New-memory notification — sent to OWNER                                  */
/* -------------------------------------------------------------------------- */

export function newMemoryNotificationEmail(input: {
  ownerDisplayName: string;
  seniorDisplayName: string;
  count: number;
  appUrl: string;
  /** Storyteller's grammatical gender, so the past-tense verb agrees ("přidal"
   *  vs "přidala"). null falls back to the "přidal/a" slash form. */
  seniorGender?: Gender | null;
}) {
  const firstName = (input.ownerDisplayName.split(" ")[0] ?? input.ownerDisplayName).trim();
  const subject =
    input.count === 1
      ? `Nová vzpomínka od ${input.seniorDisplayName}`
      : `${input.count} nových vzpomínek od ${input.seniorDisplayName}`;
  const ctaUrl = `${input.appUrl}/dashboard`;

  const added = resolveGender("{přidal|přidala}", input.seniorGender ?? null);
  const headline =
    input.count === 1
      ? `${input.seniorDisplayName} ${added} novou vzpomínku.`
      : `${input.seniorDisplayName} ${added} ${input.count} nových vzpomínek.`;

  const html = shell({
    title: subject,
    preheader: headline,
    body: `
      ${h1(`Dobrý den, ${firstName}.`)}
      <p style="margin:0 0 24px 0;">
        ${esc(headline)} Vzpomínka už čeká v archivu &mdash; když budete mít chvíli, můžete si ji
        v klidu poslechnout nebo přečíst.
      </p>
      <p style="margin:0 0 8px 0;">${cta("Otevřít archiv", ctaUrl)}</p>
      ${HR}
      <p style="margin:0;font-size:14px;color:${INK_SOFT};">
        Tyto zprávy posíláme jednou za novou vzpomínku &mdash; pokud by jich bylo moc, dejte vědět.
      </p>
      ${signoff()}
    `,
  });

  const text = [
    `Dobrý den, ${firstName}.`,
    "",
    `${headline} Vzpomínka už čeká v archivu — když budete mít chvíli, můžete si ji v klidu poslechnout nebo přečíst.`,
    "",
    `Otevřít archiv: ${ctaUrl}`,
    "",
    "Kuba a tým Vzpomínkáře",
  ].join("\n");

  return { subject, html, text };
}

/* -------------------------------------------------------------------------- */
/* 5. Book order confirmation — after Stripe success                           */
/* -------------------------------------------------------------------------- */

export function bookOrderConfirmationEmail(input: {
  ownerDisplayName: string;
  amountCzk: number;
  orderNumber?: string;
  appUrl: string;
}) {
  const subject = "Vaše objednávka knihy je zaznamenaná";
  const firstName = (input.ownerDisplayName.split(" ")[0] ?? input.ownerDisplayName).trim();
  const ctaUrl = `${input.appUrl}/dashboard`;
  const orderLine = input.orderNumber
    ? `Číslo objednávky: <strong style="font-family:'SF Mono','Menlo','Consolas',monospace;">${esc(input.orderNumber)}</strong>`
    : "";
  const amountLine =
    input.amountCzk === 0
      ? "Cena za tisk byla v rámci uvítací nabídky odpuštěna."
      : `Zaplaceno: <strong>${input.amountCzk.toLocaleString("cs-CZ")} Kč</strong>`;

  const html = shell({
    title: subject,
    preheader: "Tisk, vazba a doprava trvají přibližně 3–4 týdny.",
    body: `
      ${h1(`Děkujeme, ${firstName}.`)}
      <p style="margin:0 0 14px 0;">
        Vaši objednávku knihy jsme zaznamenali a postupně ji posíláme do tisku.
      </p>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;background:#FEF9E3;border:1px solid ${HAIRLINE};border-radius:10px;">
        <tr><td style="padding:18px 22px;font-size:15px;line-height:1.7;">
          ${orderLine ? `<div style="margin:0 0 6px 0;">${orderLine}</div>` : ""}
          <div>${amountLine}</div>
        </td></tr>
      </table>

      <p style="margin:0 0 14px 0;">
        Tisk, vazba a doprava trvají přibližně <strong>3&ndash;4 týdny</strong>. Ozveme se,
        jakmile bude kniha hotová a zabalená k odeslání.
      </p>
      <p style="margin:0 0 24px 0;color:${INK_SOFT};font-size:14px;">
        Mezitím můžete v archivu kdykoli přidat další vzpomínku &mdash; do první knihy už se
        nedostanou, ale připravíme z nich rád pokračování.
      </p>
      <p style="margin:0 0 8px 0;">${cta("Otevřít archiv", ctaUrl)}</p>
      ${HR}
      <p style="margin:0;font-size:14px;color:${INK_SOFT};">
        Pokud byste chtěli cokoli upravit, odpovězte na tento e-mail. Stihneme to do zahájení tisku.
      </p>
      ${signoff()}
    `,
  });

  const text = [
    `Děkujeme, ${firstName}.`,
    "",
    "Vaši objednávku knihy jsme zaznamenali a postupně ji posíláme do tisku.",
    "",
    input.orderNumber ? `Číslo objednávky: ${input.orderNumber}` : "",
    input.amountCzk === 0
      ? "Cena za tisk byla v rámci uvítací nabídky odpuštěna."
      : `Zaplaceno: ${input.amountCzk.toLocaleString("cs-CZ")} Kč`,
    "",
    "Tisk, vazba a doprava trvají přibližně 3–4 týdny. Ozveme se, jakmile bude kniha hotová a zabalená k odeslání.",
    "",
    "Mezitím můžete v archivu kdykoli přidat další vzpomínku — do první knihy už se nedostanou, ale rádi z nich připravíme pokračování.",
    "",
    `Otevřít archiv: ${ctaUrl}`,
    "",
    "Kuba a tým Vzpomínkáře",
  ]
    .filter(Boolean)
    .join("\n");

  return { subject, html, text };
}

/* -------------------------------------------------------------------------- */
/* 5b. Gift-book order received — guest checkout (Kniha vzpomínek)              */
/* -------------------------------------------------------------------------- */

export function shopGiftOrderConfirmationEmail(input: {
  buyerName: string;
  questionCount: number;
  amountCzk: number;
  orderNumber?: string;
  appUrl: string;
  /**
   * The dárkový poukaz token, when the buyer personalized one in the gift flow.
   * Adds a "stáhnout poukaz" CTA → /poukaz/{token}, where the PDF can be
   * downloaded (gated on the voucher being paid). Honest framing: the book is on
   * its way (3–4 weeks), the voucher is what they print + hand over today.
   */
  voucherToken?: string | null;
}) {
  const subject = "Objednávka přijata — Kniha vzpomínek";
  const firstName = (input.buyerName.split(" ")[0] ?? input.buyerName).trim();
  const ctaUrl = `${input.appUrl}/kniha`;
  const voucherUrl = input.voucherToken
    ? `${input.appUrl}/poukaz/${encodeURIComponent(input.voucherToken)}`
    : null;
  const orderLine = input.orderNumber
    ? `Číslo objednávky: <strong style="font-family:'SF Mono','Menlo','Consolas',monospace;">${esc(input.orderNumber)}</strong>`
    : "";
  const countLine = `Vybráno otázek: <strong>${input.questionCount}</strong>`;
  const amountLine =
    input.amountCzk === 0
      ? "Cena byla v rámci uvítací nabídky odpuštěna."
      : `Zaplaceno: <strong>${input.amountCzk.toLocaleString("cs-CZ")} Kč</strong>`;

  // Voucher block — only when a poukaz was created. Honest expectation-setter:
  // the book is on its way, the voucher is the thing to print + give today.
  const voucherBlock = voucherUrl
    ? `
      <p style="margin:0 0 14px 0;">
        Dárkový poukaz, který jste si připravili, je hotový. Stáhněte si ho jako PDF, vytiskněte
        a předejte &mdash; kniha je na cestě (3&ndash;4 týdny), poukaz dáte hned.
      </p>
      <p style="margin:0 0 24px 0;">${cta("Stáhnout dárkový poukaz", voucherUrl)}</p>`
    : "";

  const html = shell({
    title: subject,
    preheader: voucherUrl
      ? "Dárkový poukaz je ke stažení. Kniha dorazí do 3–4 týdnů."
      : "Vaši knihu vysázíme, vytiskneme a pošleme. Trvá to přibližně 3–4 týdny.",
    body: `
      ${h1(`Děkujeme, ${firstName}.`)}
      <p style="margin:0 0 14px 0;">
        Vaši objednávku knihy vzpomínek jsme přijali. Teď ji vysázíme, vytiskneme a svážeme &mdash;
        a jakmile bude hotová, pošleme ji na uvedenou adresu.
      </p>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;background:#FEF9E3;border:1px solid ${HAIRLINE};border-radius:10px;">
        <tr><td style="padding:18px 22px;font-size:15px;line-height:1.7;">
          ${orderLine ? `<div style="margin:0 0 6px 0;">${orderLine}</div>` : ""}
          <div style="margin:0 0 6px 0;">${countLine}</div>
          <div>${amountLine}</div>
        </td></tr>
      </table>

      ${voucherBlock}
      <p style="margin:0 0 14px 0;">
        Tisk, vazba a doprava trvají přibližně <strong>3&ndash;4 týdny</strong>. Pokud bude potřeba
        cokoli doladit, ozveme se vám e-mailem.
      </p>
      <p style="margin:0 0 8px 0;">${cta("Zpět na knihu", ctaUrl)}</p>
      ${HR}
      <p style="margin:0;font-size:14px;color:${INK_SOFT};">
        Pokud byste chtěli cokoli upravit, stačí odpovědět na tento e-mail. Píše vám člověk.
      </p>
      ${signoff()}
    `,
  });

  const text = [
    `Děkujeme, ${firstName}.`,
    "",
    "Vaši objednávku knihy vzpomínek jsme přijali. Teď ji vysázíme, vytiskneme a svážeme — a jakmile bude hotová, pošleme ji na uvedenou adresu.",
    "",
    input.orderNumber ? `Číslo objednávky: ${input.orderNumber}` : "",
    `Vybráno otázek: ${input.questionCount}`,
    input.amountCzk === 0
      ? "Cena byla v rámci uvítací nabídky odpuštěna."
      : `Zaplaceno: ${input.amountCzk.toLocaleString("cs-CZ")} Kč`,
    "",
    voucherUrl
      ? `Dárkový poukaz ke stažení (PDF): ${voucherUrl} — kniha je na cestě (3–4 týdny), poukaz dáte hned.`
      : "",
    "Tisk, vazba a doprava trvají přibližně 3–4 týdny. Pokud bude potřeba cokoli doladit, ozveme se vám e-mailem.",
    "",
    `Zpět na knihu: ${ctaUrl}`,
    "",
    "Kuba a tým Vzpomínkáře",
  ]
    .filter(Boolean)
    .join("\n");

  return { subject, html, text };
}

/* -------------------------------------------------------------------------- */
/* 5c. Book full — milestone, invite owner to order the next volume (díl)      */
/* -------------------------------------------------------------------------- */

/**
 * Sent to the OWNER once the senior's book reaches its full count (52/52).
 * Celebratory but quiet: the work is done, and the next díl is offered as a
 * gentle continuation, never a hard sell. Drives to the in-app order page.
 */
export function bookFullEmail(input: {
  ownerDisplayName: string;
  seniorDisplayName: string;
  /** Sequence number of the volume that just filled (Díl 1, Díl 2, …). */
  volumeNo: number;
  /** Price of the next volume in CZK (server-supplied). */
  nextVolumeCzk: number;
  appUrl: string;
  familyId: string;
}) {
  const firstName = (input.ownerDisplayName.split(" ")[0] ?? input.ownerDisplayName).trim();
  const subject = `Kniha pro ${input.seniorDisplayName} je plná`;
  const ctaUrl = `${input.appUrl}/family/${input.familyId}/book`;
  const nextVolumeNo = input.volumeNo + 1;
  const priceLine =
    input.nextVolumeCzk > 0
      ? `Další díl pořídíte za zvýhodněnou cenu ${input.nextVolumeCzk.toLocaleString("cs-CZ")} Kč.`
      : "Další díl pro vás máme připravený.";

  const html = shell({
    title: subject,
    preheader: `Všech 52 otázek je zodpovězeno. Pokud chcete, můžete pokračovat dílem ${nextVolumeNo}.`,
    body: `
      ${h1(`Hotovo, ${firstName}.`)}
      <p style="margin:0 0 14px 0;">
        Kniha pro ${esc(input.seniorDisplayName)} je plná &mdash; všech 52 otázek je zodpovězeno.
        Vzpomínky jsou uložené a připravené k tisku.
      </p>
      <p style="margin:0 0 24px 0;">
        Vyprávění ale nemusí končit. Pokud má ${esc(input.seniorDisplayName)} chuť pokračovat,
        můžete plynule otevřít Díl ${nextVolumeNo} a sbírat dál o stejném blízkém.
        ${esc(priceLine)}
      </p>
      <p style="margin:0 0 8px 0;">${cta(`Otevřít Díl ${nextVolumeNo}`, ctaUrl)}</p>
      ${HR}
      <p style="margin:0;font-size:14px;color:${INK_SOFT};">
        Nemusíte spěchat &mdash; první díl je v bezpečí. Kdykoli budete chtít, jsme tady.
      </p>
      ${signoff()}
    `,
  });

  const text = [
    `Hotovo, ${firstName}.`,
    "",
    `Kniha pro ${input.seniorDisplayName} je plná — všech 52 otázek je zodpovězeno. Vzpomínky jsou uložené a připravené k tisku.`,
    "",
    `Vyprávění ale nemusí končit. Pokud má ${input.seniorDisplayName} chuť pokračovat, můžete plynule otevřít Díl ${nextVolumeNo} a sbírat dál o stejném blízkém. ${priceLine}`,
    "",
    `Otevřít Díl ${nextVolumeNo}: ${ctaUrl}`,
    "",
    "Nemusíte spěchat — první díl je v bezpečí. Kdykoli budete chtít, jsme tady.",
    "",
    "Kuba a tým Vzpomínkáře",
  ].join("\n");

  return { subject, html, text };
}

/* -------------------------------------------------------------------------- */
/* 6. Lead notification — internal staff inbox                                 */
/* -------------------------------------------------------------------------- */

export function leadNotificationEmail(input: {
  email: string;
  source?: string;
  receivedAt?: Date;
}) {
  const subject = `Nový lead — ${input.email}`;
  const when = (input.receivedAt ?? new Date()).toLocaleString("cs-CZ", {
    timeZone: "Europe/Prague",
  });
  const source = input.source ?? "homepage / lead-magnet";

  // Internal email: minimal chrome, just the facts. Still escape the email
  // value because it ultimately comes from a public form.
  const html = `<!doctype html>
<html lang="cs"><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:24px;background:${CREAM};font-family:${BODY_FONT};color:${INK};">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid ${HAIRLINE};border-radius:10px;padding:20px 22px;">
    <div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:${INK_SOFT};margin:0 0 12px 0;">
      Vzpomínkář &middot; interní notifikace
    </div>
    <div style="font-size:15px;line-height:1.7;">
      <div><strong>Email:</strong> ${esc(input.email)}</div>
      <div><strong>Zdroj:</strong> ${esc(source)}</div>
      <div><strong>Čas:</strong> ${esc(when)}</div>
    </div>
  </div>
</body></html>`;

  const text = [
    "Vzpomínkář — interní notifikace",
    "",
    `Email:  ${input.email}`,
    `Zdroj:  ${source}`,
    `Čas:    ${when}`,
  ].join("\n");

  return { subject, html, text };
}

/* -------------------------------------------------------------------------- */
/* 7. Lead-magnet autoresponder — sent to the VISITOR who left their e-mail    */
/* -------------------------------------------------------------------------- */

/**
 * The single warm e-mail promised by the homepage lead-magnet form: a short
 * intro, a gold CTA to buy the main product with 200 Kč off (the link carries
 * the launch coupon), and the code shown as text for later use.
 *
 * Honesty rule: this is ONE e-mail — not a drip of three. The form copy
 * matches. The CTA link must equal what the buyer gets (VITEJTE200 = 200 Kč
 * off the base book at checkout). Built from `lib/site` SITE_URL so the origin
 * is consistent across environments.
 */
export const LEAD_WELCOME_COUPON = "VITEJTE200";

export function leadWelcomeEmail() {
  const subject = "Vaše ukázka Vzpomínkáře + sleva 200 Kč";
  const ctaUrl = `${SITE_URL}/onboarding?coupon=${LEAD_WELCOME_COUPON}`;

  const html = shell({
    title: subject,
    preheader: "Slevový kód VITEJTE200 — 200 Kč dolů z první knihy.",
    body: `
      ${h1("Děkujeme za zájem.")}
      <p style="margin:0 0 14px 0;">
        Vzpomínkář je pomalý, laskavý způsob, jak zachytit příběh někoho blízkého &mdash;
        jedna otázka týdně, žádný spěch, žádná aplikace k učení. Na konci je hotová
        hardcover Kniha vzpomínek, kterou si necháte vytisknout a předáte dál.
      </p>
      <p style="margin:0 0 24px 0;">
        Připravili jsme pro vás <strong>slevu 200 Kč</strong> na první knihu. Tlačítkem níže
        přejdete rovnou k objednávce a kód se přidá za vás.
      </p>

      <p style="margin:0 0 14px 0;">${cta("Objednat se slevou 200 Kč", ctaUrl)}</p>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px 0;background:#FEF9E3;border:1px solid ${HAIRLINE};border-radius:10px;">
        <tr><td style="padding:18px 22px;">
          <div style="font-family:${BODY_FONT};font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:${INK_SOFT};margin:0 0 6px 0;">Slevový kód</div>
          <div style="font-family:'SF Mono','Menlo','Consolas',monospace;font-size:22px;color:${INK};letter-spacing:0.04em;">${esc(LEAD_WELCOME_COUPON)}</div>
          <div style="margin:8px 0 0 0;font-size:14px;color:${INK_SOFT};">platí 200 Kč sleva, použijte i příště</div>
        </td></tr>
      </table>

      ${HR}
      <p style="margin:0;font-size:14px;color:${INK_SOFT};">
        Tohle je jediný e-mail, který vám pošleme &mdash; žádný spam, žádné triky. Kdykoli se
        můžete odhlásit nebo na zprávu prostě odpovědět. Píše vám člověk.
      </p>
      ${signoff()}
    `,
  });

  const text = [
    "Děkujeme za zájem.",
    "",
    "Vzpomínkář je pomalý, laskavý způsob, jak zachytit příběh někoho blízkého — jedna otázka týdně, žádný spěch, žádná aplikace k učení. Na konci je hotová hardcover Kniha vzpomínek, kterou si necháte vytisknout a předáte dál.",
    "",
    "Připravili jsme pro vás slevu 200 Kč na první knihu. Odkazem níže přejdete rovnou k objednávce a kód se přidá za vás.",
    "",
    `Objednat se slevou 200 Kč: ${ctaUrl}`,
    "",
    `Slevový kód: ${LEAD_WELCOME_COUPON} — platí 200 Kč sleva, použijte i příště.`,
    "",
    "Tohle je jediný e-mail, který vám pošleme — žádný spam, žádné triky. Kdykoli se můžete odhlásit nebo na zprávu prostě odpovědět. Píše vám člověk.",
    "",
    "Kuba a tým Vzpomínkáře",
  ].join("\n");

  return { subject, html, text };
}
