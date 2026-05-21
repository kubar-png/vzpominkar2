import Link from "next/link";
import { Logo } from "@/components/shared/Logo";
import { cn } from "@/lib/utils";

interface SiteFooterProps {
  /**
   * "full" - four-column site map + colophon.
   * "minimal" - colophon only, used on auth/onboarding pages.
   */
  variant?: "full" | "minimal";
}

const FOOTER_COLUMNS = [
  {
    h: "Procházet",
    links: [
      ["Jak to funguje", "/jak-to-funguje"],
      ["Ceník", "/cenik"],
      ["FAQ", "/faq"],
    ] as const,
  },
  {
    h: "Dárky",
    links: [
      ["Vzpomínkář jako dárek", "/darek"],
      ["Dárkový certifikát", "/darek/certifikat"],
      ["Babybook", "/babybook"],
    ] as const,
  },
  {
    h: "Vzpomínkář",
    links: [
      ["Náš příběh", "/o-nas"],
      ["Kontakt", "/kontakt"],
    ] as const,
  },
];

function Colophon({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col items-center gap-4 text-center text-xs text-[var(--color-paper-400)]", className)}>
      <p className="text-[11px] uppercase tracking-[0.32em] text-[var(--color-paper-400)]">
        © {new Date().getFullYear()} Vzpomínkář, s.&nbsp;r.&nbsp;o.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs">
        <Link href="/podminky" className="hover:text-white">
          Podmínky
        </Link>
        <Link href="/soukromi" className="hover:text-white">
          Soukromí
        </Link>
        <Link href="/cookies" className="hover:text-white">
          Cookies
        </Link>
      </div>
    </div>
  );
}

export function SiteFooter({ variant = "full" }: SiteFooterProps) {
  if (variant === "minimal") {
    return (
      <footer className="bg-[var(--color-navy-900)] text-[var(--color-paper-200)]">
        <div className="mx-auto max-w-[var(--container-wide)] px-6 py-12">
          <Colophon />
        </div>
      </footer>
    );
  }

  return (
    <footer className="bg-[var(--color-navy-900)] text-[var(--color-paper-200)]">
      {/* Handwritten slogan - small pen-on-paper margin note above the columns. */}
      <div className="mx-auto max-w-[var(--container-wide)] px-6 pt-12 pb-6">
        <p
          aria-hidden
          className="text-center font-[family-name:var(--font-script)] text-2xl leading-none text-[var(--color-paper-300)] sm:text-3xl"
        >
          Vzpomínkář - psáno i vyprávěno
        </p>
      </div>

      <hr aria-hidden className="mx-auto h-px w-full max-w-[var(--container-wide)] border-0 bg-[var(--color-navy-700)]" />

      <div className="mx-auto max-w-[var(--container-wide)] px-6 pt-16 pb-16">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo variant="wordmark" invert size={28} />
            <p className="mt-6 max-w-xs text-sm leading-relaxed text-[var(--color-paper-300)]">
              Psáno i vyprávěno. Pro každou rodinu vlastní knihovna.
            </p>
          </div>

          {FOOTER_COLUMNS.map((col) => (
            <div key={col.h}>
              <h4 className="mb-5 text-[11px] uppercase tracking-[0.32em] text-[var(--color-paper-400)]">
                {col.h}
              </h4>
              <ul className="space-y-3 text-sm">
                {col.links.map(([label, href]) => (
                  <li key={label}>
                    <Link href={href} className="text-[var(--color-paper-100)] hover:text-white">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <hr aria-hidden className="mt-14 h-px w-full border-0 bg-[var(--color-navy-700)]" />
        <Colophon className="mt-10" />
      </div>
    </footer>
  );
}
