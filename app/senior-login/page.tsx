import type { Metadata } from "next";
import { Logo } from "@/components/shared/Logo";
import { SeniorLoginForm } from "./senior-login-form";

export const metadata: Metadata = { title: "Přihlášení - Vzpomínkář" };

export default function SeniorLoginPage() {
  return (
    <div className="flex min-h-screen">
      {/* ── Left panel: navy editorial, desktop only ── */}
      <div className="relative hidden lg:flex lg:w-[440px] xl:w-[500px] flex-col bg-[var(--color-navy-900)] overflow-hidden">
        {/* Grain texture overlay */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E\")",
            backgroundSize: "200px 200px",
          }}
        />

        {/* Vertical red ribbon - matches homepage bookmark ribbon */}
        <div aria-hidden className="pointer-events-none absolute inset-y-0 left-8 flex flex-col">
          <svg width="6" height="9" viewBox="0 0 6 9" fill="var(--color-red-700)" className="shrink-0">
            <polygon points="3,0 6,9 0,9" />
          </svg>
          <div className="w-[6px] flex-1 bg-[var(--color-red-700)]" />
        </div>

        <div className="relative flex flex-1 flex-col justify-between px-14 py-12">
          {/* Logo */}
          <Logo variant="wordmark" invert size={30} />

          {/* Center - brand message */}
          <div className="space-y-7">
            <div className="flex items-center gap-3">
              <span className="h-px w-8 bg-[var(--color-gold-400)] opacity-60" />
              <span className="text-[10px] font-medium uppercase tracking-[0.38em] text-[var(--color-gold-400)]">
                Vzpomínkář
              </span>
            </div>

            <h2 className="font-[family-name:var(--font-display)] text-[2.4rem] font-normal leading-[1.08] tracking-tight text-[var(--color-paper-50)]">
              Váš příběh<br />čeká
            </h2>

            <p className="text-lg leading-[1.7] text-[var(--color-paper-400)]">
              Rodina připravila otázku<br />speciálně pro vás.
            </p>
          </div>

          {/* Bottom ornament */}
          <div className="flex items-center gap-4 opacity-30">
            <span className="h-px flex-1 bg-[var(--color-paper-50)]" />
            <svg width="6" height="6" viewBox="0 0 6 6" fill="var(--color-gold-400)">
              <polygon points="3,0 6,3 3,6 0,3" />
            </svg>
            <span className="h-px flex-1 bg-[var(--color-paper-50)]" />
          </div>
        </div>
      </div>

      {/* ── Right panel: white form ── */}
      <div className="flex flex-1 flex-col bg-white">
        {/* Mobile logo bar */}
        <div className="flex items-center gap-3 bg-[var(--color-navy-900)] px-6 py-5 lg:hidden">
          <Logo variant="wordmark" invert size={26} />
        </div>

        {/* Form centered vertically */}
        <div className="flex flex-1 items-center justify-center px-6 py-12 lg:py-0">
          <div className="w-full max-w-[400px]" data-surface="senior">
            {/* Heading block */}
            <div className="mb-10 space-y-3">
              <p className="text-[10px] font-medium uppercase tracking-[0.38em] text-[var(--color-gold-500)]">
                Přihlášení
              </p>
              <h1 className="font-[family-name:var(--font-display)] text-[2.25rem] font-normal leading-[1.08] tracking-tight text-[var(--color-ink-900)]">
                Vítejte zpátky
              </h1>
              <p className="text-lg leading-relaxed text-[var(--color-text-muted)]">
                Zadejte jméno a heslo,<br className="hidden sm:block" />
                které vám rodina připravila.
              </p>
            </div>

            {/* Gold rule */}
            <div className="mb-10 flex items-center gap-4">
              <span className="h-px flex-1 bg-[var(--color-border)]" />
              <svg width="6" height="6" viewBox="0 0 6 6" fill="var(--color-gold-400)">
                <polygon points="3,0 6,3 3,6 0,3" />
              </svg>
              <span className="h-px flex-1 bg-[var(--color-border)]" />
            </div>

            <SeniorLoginForm />
          </div>
        </div>

        {/* Footer note */}
        <p className="px-6 pb-8 text-center text-sm text-[var(--color-text-subtle)] lg:pb-10">
          Zapomněli jste heslo? Požádejte rodinu, aby vám vygenerovala nové.
        </p>
      </div>
    </div>
  );
}
