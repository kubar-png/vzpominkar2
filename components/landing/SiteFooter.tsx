import Link from "next/link";
import { Logo } from "@/components/shared/Logo";
import { cn } from "@/lib/utils";

interface SiteFooterProps {
  /**
   * "full" — four-column site map + colophon.
   * "minimal" — colophon only, used on auth/onboarding pages.
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
    h: "Produkty",
    links: [
      ["Vzpomínkář", "/"],
      ["Babybook", "/babybook"],
      ["Dárkový certifikát", "/darek/certifikat"],
      ["Jako dárek", "/darek"],
    ] as const,
  },
  {
    h: "Společnost",
    links: [
      ["O nás", "/o-nas"],
      ["Kontakt", "/kontakt"],
    ] as const,
  },
];

function Colophon({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col items-center gap-2 text-center text-xs text-[var(--color-paper-400)]", className)}>
      <svg
        aria-hidden
        width="44"
        height="20"
        viewBox="0 0 44 20"
        fill="none"
        className="text-[var(--color-paper-400)]"
      >
        <path
          d="M22 4c-2 0-3 1.5-3 3 0-2-2-4-5-4S9 4.5 9 7c0 3 4 5 8 5h5"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
        />
        <path
          d="M22 16c2 0 3-1.5 3-3 0 2 2 4 5 4s5-1.5 5-4c0-3-4-5-8-5h-5"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
        />
        <circle cx="22" cy="10" r="1.6" fill="currentColor" />
      </svg>
      <p className="mt-3 max-w-md font-[family-name:var(--font-display)] text-sm italic leading-relaxed text-[var(--color-paper-300)]">
        Vázáno v Praze · {new Date().getFullYear()}
        <span className="mx-2 opacity-60">·</span>
        Sazba: EB Garamond &amp; Inter
        <br />
        Vzpomínkář, vydavatel rodinných kronik.
      </p>
      <p className="mt-3 text-[10px] uppercase tracking-[0.32em] text-[var(--color-paper-400)]">
        © {new Date().getFullYear()} Vzpomínkář, s.&nbsp;r.&nbsp;o.
      </p>
      <div className="mt-4 flex items-center gap-6 text-xs">
        <Link href="/podminky" className="hover:text-white">
          Podmínky
        </Link>
        <span aria-hidden className="opacity-40">·</span>
        <Link href="/soukromi" className="hover:text-white">
          Soukromí
        </Link>
        <span aria-hidden className="opacity-40">·</span>
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
      {/* Founder farewell — closes the page with the human voice behind the
       * product. EB Garamond italic for the pull quote, Caveat handwriting
       * for the signature so it reads like an actual pen on paper. */}
      <div className="mx-auto max-w-[var(--container-wide)] px-6 pt-20 pb-14">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[10px] uppercase tracking-[0.32em] text-[var(--color-gold-400)]">
            <span className="mr-3 inline-block h-px w-8 align-middle bg-[var(--color-gold-400)]" />
            Závěrem
            <span className="ml-3 inline-block h-px w-8 align-middle bg-[var(--color-gold-400)]" />
          </p>
          <p
            className="mt-8 font-[family-name:var(--font-display)] text-2xl italic leading-snug text-[var(--color-paper-50)] sm:text-3xl"
            style={{ textWrap: "balance" }}
          >
            &bdquo;Když mi babička v&nbsp;devadesáti zemřela, zůstaly nám tři
            fotky a&nbsp;krabice s&nbsp;pohlednicemi. Vzpomínkář jsme stvořili,
            abychom neopakovali stejnou chybu u&nbsp;svých rodičů.&ldquo;
          </p>
          <p
            className="mt-8 font-[family-name:var(--font-script)] text-5xl leading-none text-[var(--color-paper-100)] sm:text-6xl"
            aria-hidden
          >
            Jakub Š.
          </p>
          <p className="mt-3 text-[10px] uppercase tracking-[0.32em] text-[var(--color-paper-400)]">
            <span className="sr-only">Jakub Š., </span>zakladatel Vzpomínkáře
          </p>
        </div>
      </div>

      <hr aria-hidden className="mx-auto h-px w-full max-w-[var(--container-wide)] border-0 bg-[var(--color-navy-700)]" />

      <div className="mx-auto max-w-[var(--container-wide)] px-6 pt-16 pb-16">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo variant="wordmark" invert size={28} />
            <p className="mt-6 max-w-xs font-[family-name:var(--font-display)] text-base italic leading-snug text-[var(--color-paper-300)]">
              Psáno i vyprávěno &mdash; pro každou rodinu vlastní knihovna.
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
