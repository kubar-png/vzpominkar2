/**
 * Render every transactional email template to /tmp/ so we can eyeball them
 * in a browser before sending real mail. Plain-text fallbacks land in
 * sibling .txt files.
 *
 * Run:
 *   pnpm dlx tsx scripts/preview-emails.ts
 *   open /tmp/vzpominkar-emails/index.html
 *
 * NOTE: the templates module starts with `import "server-only"`, which
 * throws when imported outside a Next/RSC runtime. We shim it before the
 * dynamic import so this script works in plain Node/tsx.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import Module from "node:module";

// --- shim `server-only` so the templates file can be imported in plain Node ---
const shimPath = join(tmpdir(), `vzpominkar-server-only-${process.pid}.cjs`);
writeFileSync(shimPath, "module.exports = {};\n");
const originalResolve = (Module as unknown as {
  _resolveFilename: (request: string, ...rest: unknown[]) => string;
})._resolveFilename;
(Module as unknown as {
  _resolveFilename: (request: string, ...rest: unknown[]) => string;
})._resolveFilename = function (request: string, ...rest: unknown[]) {
  if (request === "server-only") return shimPath;
  return originalResolve.call(this, request, ...rest);
};

const OUT_DIR = "/tmp/vzpominkar-emails";
mkdirSync(OUT_DIR, { recursive: true });

async function main() {
  const tpl = await import("../lib/email/templates");

  const APP_URL = "https://vzpominkar.cz";
  const cases = [
    {
      slug: "01-owner-welcome",
      label: "1. Owner welcome",
      rendered: tpl.welcomeEmail({ displayName: "Jakub Novák", appUrl: APP_URL }),
    },
    {
      slug: "02-senior-credentials",
      label: "2. Senior login credentials (sent to owner)",
      rendered: tpl.seniorCredentialsEmail({
        ownerDisplayName: "Jakub Novák",
        seniorDisplayName: "Babička Marie",
        username: "babicka-marie",
        password: "lipa-vlnka-23",
        appUrl: APP_URL,
        familyId: "demo-family-id",
      }),
    },
    {
      slug: "03-weekly-reminder",
      label: "3. Weekly question reminder (sent to senior)",
      rendered: tpl.weeklyReminderEmail({
        seniorDisplayName: "Babička Marie",
        question:
          "Jaký byl váš nejoblíbenější rituál v dětství — něco, co se opakovalo a na co se vždy těšila celá rodina?",
        appUrl: APP_URL,
      }),
    },
    {
      slug: "04-new-memory",
      label: "4. New-memory notification (sent to owner)",
      rendered: tpl.newMemoryNotificationEmail({
        ownerDisplayName: "Jakub Novák",
        seniorDisplayName: "Babička Marie",
        count: 1,
        appUrl: APP_URL,
      }),
    },
    {
      slug: "05-book-order",
      label: "5. Book order confirmation",
      rendered: tpl.bookOrderConfirmationEmail({
        ownerDisplayName: "Jakub Novák",
        amountCzk: 1490,
        orderNumber: "VZP-2026-0042",
        appUrl: APP_URL,
      }),
    },
    {
      slug: "06-lead-notification",
      label: "6. Lead notification (internal)",
      rendered: tpl.leadNotificationEmail({
        email: "novy.zajemce@example.com",
        source: "homepage / lead-magnet",
        receivedAt: new Date("2026-05-23T10:14:00+02:00"),
      }),
    },
  ];

  for (const c of cases) {
    writeFileSync(join(OUT_DIR, `${c.slug}.html`), c.rendered.html);
    writeFileSync(join(OUT_DIR, `${c.slug}.txt`), c.rendered.text ?? "");
    console.log(`✓ ${c.label}  →  ${OUT_DIR}/${c.slug}.html`);
  }

  // Index page that links to all previews.
  const index = `<!doctype html><html lang="cs"><head><meta charset="utf-8"/>
<title>Vzpomínkář — email previews</title>
<style>
  body{margin:0;padding:40px;background:#f4ebd6;color:#0e3b64;font-family:-apple-system,BlinkMacSystemFont,sans-serif;}
  h1{font-family:Georgia,serif;font-weight:400;font-size:32px;margin:0 0 24px 0;}
  ol{font-size:16px;line-height:2;list-style:none;padding:0;}
  a{color:#0e3b64;text-decoration:none;border-bottom:1px solid #d4a017;}
  a:hover{background:#fbf5e3;}
  small{color:#5a6b7c;margin-left:8px;font-size:13px;}
</style></head><body>
<h1>Vzpomínkář — transactional email previews</h1>
<ol>${cases
    .map(
      (c) =>
        `<li><a href="./${c.slug}.html">${c.label}</a><small>“${c.rendered.subject}”</small> · <a href="./${c.slug}.txt">text fallback</a></li>`,
    )
    .join("\n")}</ol>
</body></html>`;
  writeFileSync(join(OUT_DIR, "index.html"), index);
  console.log(`\nIndex:  ${OUT_DIR}/index.html`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
