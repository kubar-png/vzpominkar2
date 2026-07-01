import type { Metadata } from "next";
import type { ReactNode } from "react";

/**
 * /testovani — private tester run.
 *
 * Minimal wrapper only. The landing page carries its own editorial chrome
 * (logo + footer); the /testovani/nazor questionnaire is a self-contained
 * full-screen flow with its own header — so this layout stays chrome-free to
 * avoid double headers and the .editorial h1 cascade leaking into the survey.
 * The whole site is noindex globally, so testers reach these pages directly.
 */
export const metadata: Metadata = {
  title: "Vyzkoušejte Vzpomínkář",
  description:
    "Krátké provedení testem: založíte účet, přidáte blízkého, pošlete mu dvě otázky a řeknete nám názor. Zabere to zhruba deset minut.",
};

export default function TestovaniLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
      {children}
    </div>
  );
}
