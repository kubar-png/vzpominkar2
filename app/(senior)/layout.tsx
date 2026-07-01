import Link from "next/link";
import { requireSenior } from "@/lib/auth/permissions";
import { signOut } from "@/lib/auth/actions";
import { Logo } from "@/components/brand/Logo";

/**
 * Senior shell — brand direction.
 *
 * Off-white paper canvas (same `--bg` as the marketing homepage), the brand
 * SVG wordmark, big "Odhlásit" outline button. The `.editorial-senior` scope
 * class in globals.css carries every design token: typography, buttons, cards,
 * recording UI. No sidebar, no modals.
 *
 * AAA contrast is enforced by the scope: navy ink on off-white clears WCAG
 * AAA, and the raspberry pill uses off-white text.
 */
export default async function SeniorLayout({ children }: { children: React.ReactNode }) {
  const user = await requireSenior();

  const mode = user.isSenior ? "senior" : "klasik";

  return (
    <div className="editorial-senior" data-surface="senior" data-mode={mode}>
      <header className="es-header">
        <div className="es-header-inner">
          <Link
            href="/home"
            aria-label="Vzpomínkář — domů"
            className="inline-flex items-center"
          >
            <Logo tone="raspberry" height={30} />
          </Link>

          <div className="flex items-center gap-3 sm:gap-4">
            {user.displayName ? (
              <span className="hidden sm:inline text-[17px] text-[var(--ink-soft)]">
                {user.displayName}
              </span>
            ) : null}
            <form action={signOut}>
              <button type="submit" className="es-btn es-btn-outline">
                Odhlásit
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="es-container py-10 sm:py-14">
        {children}
      </main>
    </div>
  );
}
