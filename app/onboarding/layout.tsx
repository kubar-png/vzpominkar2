import Link from "next/link";
import { signOut } from "@/lib/auth/actions";
import { VerifyEmailNotice } from "@/components/app/VerifyEmailNotice";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <header className="bg-[var(--color-bg)]">
        <div className="mx-auto flex h-[72px] max-w-[var(--container-wide)] items-center justify-between px-6">
          <Link href="/" aria-label="Vzpomínkář — domů" className="inline-flex">
            {/* Gold wordmark — same mask technique as the app header/sidebar. */}
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
          <form action={signOut}>
            <button
              type="submit"
              className="text-sm text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
            >
              Odhlásit se
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-[var(--container-default)] px-6 py-10 sm:py-16">
        <VerifyEmailNotice className="mb-8" />
        {children}
      </main>
    </div>
  );
}
