import Link from "next/link";
import { Logo } from "@/components/shared/Logo";
import { signOut } from "@/lib/auth/actions";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <header className="bg-[var(--color-bg)]">
        <div className="mx-auto flex h-[72px] max-w-[var(--container-wide)] items-center justify-between px-6">
          <Link href="/">
            <Logo variant="wordmark" size={28} />
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
        {children}
      </main>
    </div>
  );
}
