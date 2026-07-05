import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { currentUser } from "@/lib/auth/permissions";
import { getTesterProgress } from "@/lib/testing/state";
import { TesterHub } from "./tester-hub";

/**
 * /testovani — the link we send to testers.
 *
 * Logged out: a warm explanation of what we're testing + a single CTA to
 * register (carrying ?test=1 so the account is flagged as a tester).
 * Logged in: a light "hub" that hands off into the real app — we deliberately
 * DON'T hand-hold here; the tester uses the app's own first-run guide so we can
 * see how they cope unaided. A feedback link is always available.
 */
export const dynamic = "force-dynamic";

export default async function TestovaniPage() {
  const user = await currentUser();
  const isOwner = user?.role === "owner";
  const firstName = user?.displayName?.trim().split(" ")[0] ?? "";

  // The Hub is the tester run — real (non-tester) owners don't belong here; send
  // them to their dashboard so they never see "testovací účet" copy.
  if (isOwner && !user?.isTester) redirect("/dashboard");

  const progress = isOwner ? await getTesterProgress() : null;

  return (
    <div className="editorial">
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "22px var(--gutter-editorial)",
          maxWidth: "var(--container-editorial)",
          margin: "0 auto",
        }}
      >
        <Link href="/testovani" aria-label="Vzpomínkář — testování">
          <Logo tone="raspberry" height={30} />
        </Link>
        <span style={{ fontSize: 14, color: "var(--ink-soft)" }}>Testovací provoz</span>
      </header>

      <section className="section" style={{ paddingTop: "clamp(8px, 2vw, 24px)" }}>
        <div className="container" style={{ maxWidth: 720 }}>
          {progress ? (
            <TesterHub
              firstName={firstName}
              seniorName={progress.seniorName}
              magicLink={progress.magicLink}
              questionsSent={progress.questionsSent}
              answersCount={progress.answersCount}
              nextStep={progress.nextStep}
            />
          ) : (
            <Intro />
          )}
        </div>
      </section>

      <footer
        style={{
          maxWidth: "var(--container-editorial)",
          margin: "0 auto",
          padding: "48px var(--gutter-editorial) 64px",
          fontSize: 14,
          color: "var(--ink-soft)",
        }}
      >
        Děkujeme, že Vzpomínkář zkoušíte. Vaše postřehy nám pomáhají, ať slouží rodinám co nejlíp.
      </footer>
    </div>
  );
}

/* ── Logged-out: explanation + register CTA ─────────────────────────────── */
function Intro() {
  return (
    <>
      <h1 style={{ fontSize: "clamp(38px, 5.5vw, 64px)", marginBottom: 20 }}>
        Pomozte nám vyzkoušet Vzpomínkář
      </h1>
      <p style={{ fontSize: "clamp(17px, 1.4vw, 20px)", lineHeight: 1.6, maxWidth: 640 }}>
        Vzpomínkář posílá vašim blízkým každý týden jednu otázku o jejich životě. Oni odpoví
        hlasem nebo textem a z odpovědí postupně vzniká vytištěná kniha vzpomínek.
      </p>
      <p style={{ marginTop: 16, maxWidth: 640 }}>
        Zkoušíme ranou verzi a moc nám pomůže, když si ji projdete jako reálný uživatel — založíte
        účet, přidáte blízkého (rodiče nebo prarodiče), pošlete mu pár otázek a necháte ho
        odpovědět. Zabere to zhruba deset minut.
      </p>
      <p style={{ marginTop: 16, maxWidth: 640 }}>
        Nebudeme vás přitom moc navádět — chceme vidět, jak se v aplikaci vyznáte sami. Na konci se
        vás pár otázkami zeptáme na názor.
      </p>

      <div style={{ marginTop: 32 }}>
        <Link href="/signup?test=1" className="btn btn-gold hero-cta">
          Zaregistrovat se a začít
          <span className="arrow" aria-hidden>
            ↗
          </span>
        </Link>
      </div>
    </>
  );
}
