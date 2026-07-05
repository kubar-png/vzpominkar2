import type { Metadata } from "next";
import Link from "next/link";

/**
 * Calm notice — /q/blizky.
 *
 * Where the /q/{token} route sends someone who is ALREADY signed in as a
 * different user (in practice: the owner, who copied the senior's magic login
 * link to test it). We deliberately do NOT consume the token or swap the session
 * here — the owner stays the owner. This page just explains, without alarm, that
 * the link logs in their family member on the senior's OWN device.
 *
 * It reveals nothing about token validity: the route only lands an owner here
 * when the token already resolved to a real, different senior, and this page
 * says the same thing regardless.
 */

export const runtime = "nodejs";

export const metadata: Metadata = {
  title: "Odkaz pro vašeho blízkého — Vzpomínkář",
  robots: { index: false, follow: false },
};

const NAVY = "var(--color-navy-700)";
const CREAM = "var(--color-on-accent)";
const INK_SOFT = "color-mix(in srgb, var(--color-navy-700) 72%, transparent)";
const FONT_BODY = "var(--font-body-editorial)";
const FONT_HEAD = "var(--font-display-editorial)";

export default function QBlizkyPage() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        background: CREAM,
        color: NAVY,
        fontFamily: FONT_BODY,
        display: "flex",
        justifyContent: "center",
        padding: "40px 20px 56px",
      }}
    >
      <article style={{ width: "100%", maxWidth: 540 }}>
        <h1 style={{ fontFamily: FONT_HEAD, fontSize: 25, lineHeight: 1.25, fontWeight: 500, margin: "0 0 16px" }}>
          Tento odkaz patří vašemu blízkému
        </h1>

        <p style={{ fontSize: 17, lineHeight: 1.7, margin: "0 0 16px" }}>
          Tento odkaz přihlašuje vašeho blízkého na jeho zařízení &mdash; vy
          zůstáváte přihlášení jako vy. Nic jsme tedy nezměnili a z vašeho účtu
          jste se neodhlásili.
        </p>

        <p style={{ fontSize: 17, lineHeight: 1.7, margin: "0 0 24px" }}>
          Odkaz pošlete svému blízkému, ať si ho otevře přímo na svém telefonu
          nebo počítači. Tam ho jediným klepnutím přihlásí rovnou k týdenní otázce
          &mdash; bez hesla a bez přihlašování.
        </p>

        <Link
          href="/dashboard"
          style={{
            display: "block",
            width: "100%",
            boxSizing: "border-box",
            padding: "16px 20px",
            fontFamily: FONT_BODY,
            fontSize: 17,
            fontWeight: 600,
            color: CREAM,
            background: NAVY,
            border: "none",
            borderRadius: 10,
            textAlign: "center",
            textDecoration: "none",
          }}
        >
          Zpět do mého účtu
        </Link>

        <p style={{ fontSize: 14, color: INK_SOFT, lineHeight: 1.6, margin: "20px 0 0" }}>
          Odkaz pro blízkého najdete kdykoliv na jeho stránce ve vašem účtu.
        </p>
      </article>
    </main>
  );
}
