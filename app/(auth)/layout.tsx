import Link from "next/link";

/**
 * Owner auth chrome (login / signup / reset). Mirrors the onboarding layout —
 * gold wordmark header on the parchment canvas, no marketing nav — so signing
 * in/up feels like the first step of the same editorial flow. (Senior login
 * has its own split-screen layout and is unaffected.)
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <header className="bg-[var(--color-bg)]">
        <div className="mx-auto flex h-[72px] max-w-[var(--container-wide)] items-center justify-between px-6">
          <Link href="/" aria-label="Vzpomínkář — domů" className="inline-flex">
            {/* Gold wordmark — same CSS-mask technique as onboarding/app. */}
            <span
              aria-hidden
              className="block"
              style={{
                width: 136,
                aspectRatio: "1892 / 390",
                backgroundColor: "var(--gold)",
                WebkitMask: "url('/brand/logo-mask.png') no-repeat left center / contain",
                mask: "url('/brand/logo-mask.png') no-repeat left center / contain",
              }}
            />
          </Link>
          <Link
            href="/"
            className="text-sm text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
          >
            Zpět na web
          </Link>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
