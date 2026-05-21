import "server-only";

/**
 * Plain-HTML email templates. Inlined styles are intentional - most email
 * clients ignore <style> and external CSS. Keep templates minimal and
 * mobile-first; use system fonts.
 *
 * Czech copy throughout. Brand colors mirror app/globals.css.
 */

const NAVY = "#0e3b64";
const PAPER = "#faf8f3";
const RED = "#d00000";
const TEXT = "#0a2c4d";
const MUTED = "#635944";

function shell(opts: { title: string; preheader?: string; body: string }) {
  return `<!doctype html>
<html lang="cs">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(opts.title)}</title>
</head>
<body style="margin:0;padding:0;background:${PAPER};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:${TEXT};">
  ${
    opts.preheader
      ? `<div style="display:none;max-height:0;overflow:hidden;color:transparent">${esc(opts.preheader)}</div>`
      : ""
  }
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${PAPER};">
    <tr><td align="center" style="padding:32px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:#ffffff;border-radius:16px;border:1px solid #ece5d3;">
        <tr><td style="padding:32px 32px 24px 32px;">
          <p style="margin:0 0 24px 0;font-family:Georgia,serif;font-size:20px;color:${NAVY};">Vzpomínkář</p>
          ${opts.body}
        </td></tr>
      </table>
      <p style="margin:24px 0 0 0;font-size:12px;color:${MUTED};">© Vzpomínkář - Psáno i vyprávěno</p>
    </td></tr>
  </table>
</body>
</html>`;
}

function btn(label: string, href: string, color: string = NAVY) {
  return `<a href="${esc(href)}" style="display:inline-block;background:${color};color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:600;">${esc(label)}</a>`;
}

function esc(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* -------------------------------------------------------------------------- */
export function welcomeEmail(input: { displayName: string; appUrl: string }) {
  const subject = "Vítejte ve Vzpomínkáři";
  const html = shell({
    title: subject,
    preheader: "Začněme zaznamenávat rodinné vzpomínky.",
    body: `
      <h1 style="margin:0 0 16px 0;font-family:Georgia,serif;font-size:32px;color:${NAVY};">
        Vítejte, ${esc(input.displayName)}.
      </h1>
      <p style="margin:0 0 16px 0;font-size:16px;line-height:1.55;">
        Děkujeme, že jste se rozhodli zachovat rodinné vzpomínky. V dalších krocích si nastavíte
        rodinný projekt a vytvoříte přístup pro vyprávějícího.
      </p>
      <p style="margin:24px 0;">
        ${btn("Otevřít Vzpomínkář", `${input.appUrl}/dashboard`)}
      </p>
      <p style="margin:24px 0 0 0;font-size:14px;color:${MUTED};">
        Cokoli budete potřebovat, jen odpovězte na tento e-mail.
      </p>
    `,
  });
  return { subject, html, text: `Vítejte, ${input.displayName}. Otevřete Vzpomínkář na ${input.appUrl}/dashboard` };
}

/* -------------------------------------------------------------------------- */
export function weeklyReminderEmail(input: {
  seniorDisplayName: string;
  question: string;
  appUrl: string;
}) {
  const subject = `${input.seniorDisplayName}, máte novou otázku ve Vzpomínkáři`;
  const html = shell({
    title: subject,
    preheader: input.question,
    body: `
      <h1 style="margin:0 0 16px 0;font-family:Georgia,serif;font-size:28px;color:${NAVY};">
        Dobrý den, ${esc(input.seniorDisplayName)}.
      </h1>
      <p style="margin:0 0 16px 0;font-size:16px;line-height:1.55;">
        Vaše rodina pro vás připravila otázku:
      </p>
      <blockquote style="margin:16px 0;padding:16px 20px;background:${PAPER};border-left:3px solid ${RED};font-family:Georgia,serif;font-size:20px;line-height:1.4;color:${NAVY};">
        ${esc(input.question)}
      </blockquote>
      <p style="margin:24px 0;">
        ${btn("Odpovědět ve Vzpomínkáři", `${input.appUrl}/senior-login`, NAVY)}
      </p>
      <p style="margin:0;font-size:14px;color:${MUTED};">
        Není kam spěchat - kdykoli se k otázce můžete vrátit.
      </p>
    `,
  });
  return {
    subject,
    html,
    text: `Otázka pro vás: ${input.question}\n\nOdpovědět: ${input.appUrl}/senior-login`,
  };
}

/* -------------------------------------------------------------------------- */
export function newMemoryNotificationEmail(input: {
  ownerDisplayName: string;
  seniorDisplayName: string;
  count: number;
  appUrl: string;
}) {
  const subject =
    input.count === 1
      ? `Nová vzpomínka od ${input.seniorDisplayName}`
      : `${input.count} nových vzpomínek od ${input.seniorDisplayName}`;
  const html = shell({
    title: subject,
    body: `
      <h1 style="margin:0 0 16px 0;font-family:Georgia,serif;font-size:28px;color:${NAVY};">
        Hezký den, ${esc(input.ownerDisplayName)}.
      </h1>
      <p style="margin:0 0 16px 0;font-size:16px;line-height:1.55;">
        ${esc(input.seniorDisplayName)} ${input.count === 1 ? "nahrál(a) novou vzpomínku" : `nahrál(a) ${input.count} nových vzpomínek`}.
      </p>
      <p style="margin:24px 0;">
        ${btn("Podívat se", `${input.appUrl}/dashboard`)}
      </p>
    `,
  });
  return { subject, html };
}

/* -------------------------------------------------------------------------- */
export function bookOrderConfirmationEmail(input: {
  ownerDisplayName: string;
  amountCzk: number;
  appUrl: string;
}) {
  const subject = "Objednávka knihy přijata";
  const html = shell({
    title: subject,
    body: `
      <h1 style="margin:0 0 16px 0;font-family:Georgia,serif;font-size:28px;color:${NAVY};">
        Děkujeme, ${esc(input.ownerDisplayName)}.
      </h1>
      <p style="margin:0 0 16px 0;font-size:16px;line-height:1.55;">
        Vaši objednávku knihy jsme přijali. ${
          input.amountCzk === 0
            ? "Cena za tisk byla v MVP odpuštěna - kniha jde do tisku."
            : `Zaplatili jste ${input.amountCzk.toLocaleString("cs-CZ")} Kč.`
        }
      </p>
      <p style="margin:24px 0;">
        ${btn("Sledovat stav", `${input.appUrl}/dashboard`)}
      </p>
    `,
  });
  return { subject, html };
}
