import "server-only";

/**
 * Transactional email templates — editorial brand.
 *
 * Design rules (mirrors marketing site, simplified for email clients):
 *   • Cream backdrop (#f4ebd6), paper-card body (#fbf5e3) with soft shadow.
 *   • Display headings → Georgia (a web-safe stand-in for PP Pangaia).
 *   • Body type   → system stack at 1.6 leading.
 *   • Accents     → handwritten "Bradley Hand" only for the wordmark + sign-off.
 *   • CTA         → gold pill (#d4a017), white text, trailing ↗.
 *   • Footer      → tiny editorial line + Roman numeral MMXXVI.
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

const CREAM = "#f4ebd6";
const PAPER = "#fbf5e3";
const INK = "#0e3b64";
const INK_SOFT = "#5a6b7c";
const GOLD = "#d4a017";
const OXBLOOD = "#a8231f";
const HAIRLINE = "#e8dec3";

const DISPLAY_FONT = `Georgia, "Times New Roman", serif`;
const BODY_FONT = `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`;
const HAND_FONT = `"Bradley Hand", "Brush Script MT", cursive`;

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
 * Outer brand shell. `opts.headerEyebrow` is the tiny uppercase label that
 * sits above the wordmark (e.g. "VÍTEJTE", "TÝDENNÍ OTÁZKA"). `opts.body`
 * is raw HTML — callers must pre-escape any user input themselves.
 */
function shell(opts: {
  title: string;
  preheader?: string;
  headerEyebrow?: string;
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
            ${
              opts.headerEyebrow
                ? `<div style="font-family:${BODY_FONT};font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:${INK_SOFT};margin:0 0 6px 0;">${esc(opts.headerEyebrow)}</div>`
                : ""
            }
            <div style="font-family:${HAND_FONT};font-size:28px;color:${INK};line-height:1;">Vzpomínkář</div>
          </td>
        </tr>
      </table>

      <!-- Paper card -->
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:${PAPER};border:1px solid ${HAIRLINE};border-radius:14px;box-shadow:0 1px 0 rgba(14,59,100,0.04),0 12px 30px -18px rgba(14,59,100,0.18);">
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
                Vzpomínkář &middot; Praha &middot; <a href="mailto:ahoj@vzpominkar.cz" style="color:${INK_SOFT};text-decoration:none;">ahoj@vzpominkar.cz</a>
              </td>
              <td align="right" style="font-family:${DISPLAY_FONT};font-size:11px;color:${INK_SOFT};letter-spacing:0.12em;">
                MMXXVI
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

/** Gold pill CTA with trailing ↗. */
function cta(label: string, href: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0;"><tr><td align="center" style="background:${GOLD};border-radius:999px;mso-padding-alt:14px 28px;">
    <a href="${esc(href)}" style="display:inline-block;padding:14px 28px;font-family:${BODY_FONT};font-size:15px;font-weight:600;letter-spacing:0.01em;color:#ffffff;text-decoration:none;line-height:1;">
      ${esc(label)} <span style="opacity:0.85;">&#8599;</span>
    </a>
  </td></tr></table>`;
}

/** Display heading (Georgia, large). */
function h1(text: string, color: string = INK): string {
  return `<h1 style="margin:0 0 18px 0;font-family:${DISPLAY_FONT};font-size:30px;line-height:1.15;color:${color};font-weight:400;letter-spacing:-0.01em;">${esc(text)}</h1>`;
}

/** Soft hairline separator inside the card. */
const HR = `<div style="height:1px;background:${HAIRLINE};margin:24px 0;line-height:1px;font-size:1px;">&nbsp;</div>`;

/** Handwritten sign-off line. */
function signoff(name: string = "Kuba a tým Vzpomínkáře"): string {
  return `<p style="margin:24px 0 0 0;font-family:${HAND_FONT};font-size:20px;color:${INK};line-height:1.3;">${esc(name)}</p>`;
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
    headerEyebrow: "Vítejte",
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
    headerEyebrow: "Přihlašovací lísteček",
    body: `
      ${h1(`Pro ${input.seniorDisplayName} jsme připravili přihlašovací údaje.`)}
      <p style="margin:0 0 20px 0;">
        Dobrý den, ${esc(firstName)}. Níže jsou přístupy, které vyprávějícímu předáte. Doporučujeme
        si je společně v klidu zapsat na lísteček a nalepit někam k počítači &mdash; tak je nikdy nehledá.
      </p>

      <!-- Credentials block -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px 0;background:#fffaf0;border:1px solid ${HAIRLINE};border-radius:10px;">
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
  /** Optional secure-link token so the senior doesn't have to log in. */
  token?: string;
}) {
  const subject = "Tento týden vám rodina poslala otázku";
  const primaryUrl = input.token
    ? `${input.appUrl}/q/${input.token}`
    : `${input.appUrl}/senior-login`;

  const html = shell({
    title: subject,
    preheader: input.question,
    headerEyebrow: "Týdenní otázka",
    bodySize: 18,
    body: `
      ${h1(`Dobrý den, ${input.seniorDisplayName}.`)}
      <p style="margin:0 0 18px 0;">
        Tento týden vám rodina poslala otázku. Když si na ni vzpomenete, můžete odpovědět hlasem
        nebo písmem &mdash; jak je vám pohodlnější.
      </p>

      <blockquote style="margin:24px 0;padding:24px 26px;background:#fffaf0;border-left:3px solid ${OXBLOOD};border-radius:8px;font-family:${DISPLAY_FONT};font-size:24px;line-height:1.35;color:${INK};font-style:italic;">
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
}) {
  const firstName = (input.ownerDisplayName.split(" ")[0] ?? input.ownerDisplayName).trim();
  const subject =
    input.count === 1
      ? `Nová vzpomínka od ${input.seniorDisplayName}`
      : `${input.count} nových vzpomínek od ${input.seniorDisplayName}`;
  const ctaUrl = `${input.appUrl}/dashboard`;

  const headline =
    input.count === 1
      ? `${input.seniorDisplayName} přidal(a) novou vzpomínku.`
      : `${input.seniorDisplayName} přidal(a) ${input.count} nových vzpomínek.`;

  const html = shell({
    title: subject,
    preheader: headline,
    headerEyebrow: "Nová vzpomínka",
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
    headerEyebrow: "Objednávka knihy",
    body: `
      ${h1(`Děkujeme, ${firstName}.`)}
      <p style="margin:0 0 14px 0;">
        Vaši objednávku knihy jsme zaznamenali a postupně ji posíláme do tisku.
      </p>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;background:#fffaf0;border:1px solid ${HAIRLINE};border-radius:10px;">
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
