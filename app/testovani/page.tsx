import Link from "next/link";
import QRCode from "qrcode";
import { Logo } from "@/components/brand/Logo";
import { getTesterProgress, sendTestQuestionsNow } from "@/lib/testing/state";
import { currentUser } from "@/lib/auth/permissions";
import { TesterChecklist } from "./_components/TesterChecklist";

/**
 * /testovani — warm intro + guiding checklist for the private tester run.
 *
 * Server Component: reads the tester's real progress via getTesterProgress()
 * (Foundation contract) and hands the send-questions-now server action down to
 * the interactive checklist. The magic-link QR is rendered server-side (the
 * `qrcode` package is Node-only) into a data URL so the client component stays
 * dependency-free.
 */
export const dynamic = "force-dynamic";

async function buildQr(link: string | null): Promise<string | null> {
  if (!link) return null;
  try {
    return await QRCode.toDataURL(link, {
      margin: 1,
      width: 220,
      color: { dark: "#1B2E4D", light: "#FFFDF3" },
    });
  } catch {
    return null;
  }
}

export default async function TestovaniPage() {
  const [progress, user] = await Promise.all([getTesterProgress(), currentUser()]);
  const qrDataUrl = await buildQr(progress.magicLink);

  // Manual alternative to the "send now" button: the real in-app prompt picker.
  const promptsHref = user?.familyId ? `/family/${user.familyId}/prompts` : null;

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
        <div className="container" style={{ maxWidth: 820 }}>
        <h1 style={{ fontSize: "clamp(38px, 5.5vw, 64px)", marginBottom: 20 }}>
          Vyzkoušejte Vzpomínkář na vlastní rodině
        </h1>
        <p style={{ fontSize: "clamp(17px, 1.4vw, 20px)", lineHeight: 1.6, maxWidth: 640 }}>
          Vzpomínkář posílá vašim blízkým každý týden jednu otázku o jejich životě. Oni odpoví
          hlasem nebo textem a z odpovědí postupně vzniká vytištěná kniha vzpomínek.
        </p>
        <p style={{ marginTop: 16, maxWidth: 640 }}>
          Zabere to zhruba deset minut. Poprosíme vás, ať si založíte účet,
          přidáte jednoho blízkého (rodiče nebo prarodiče), pošlete mu dvě otázky, necháte ho
          odpovědět a pak nám řeknete svůj názor. Projdeme to spolu krok za krokem.
        </p>

        <TesterChecklist
          progress={progress}
          qrDataUrl={qrDataUrl}
          promptsHref={promptsHref}
          sendAction={sendTestQuestionsNow}
        />
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
