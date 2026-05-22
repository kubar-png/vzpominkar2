import Link from "next/link";
import { requireSenior } from "@/lib/auth/permissions";
import { signOut } from "@/lib/auth/actions";

/**
 * Senior shell — editorial direction.
 *
 * Cream paper canvas (same `--bg` as the marketing homepage), wordmark logo
 * with the editorial gold underline, big "Odhlásit" outline button. The
 * `.editorial-senior` scope class in globals.css carries every design token:
 * typography, buttons, cards, recording UI. No sidebar, no modals.
 *
 * AAA contrast is enforced by the scope: navy ink (#0e3b64) on cream
 * (#f4ebd6) clears WCAG AAA (~10.6:1), and the gold pill uses navy text
 * (~9:1).
 */
export default async function SeniorLayout({ children }: { children: React.ReactNode }) {
  const user = await requireSenior();

  const mode = user.isSenior ? "senior" : "klasik";

  return (
    <div className="editorial-senior" data-surface="senior" data-mode={mode}>
      <header className="es-header">
        <div className="es-header-inner">
          <Link href="/home" className="es-logo" aria-label="Vzpomínkář — domů">
            Vzpomínkář.
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
