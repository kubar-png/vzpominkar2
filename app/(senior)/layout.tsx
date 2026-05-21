import { requireSenior } from "@/lib/auth/permissions";
import { signOut } from "@/lib/auth/actions";
import { Logo } from "@/components/shared/Logo";
import { SeniorButton } from "@/components/senior/SeniorButton";

export default async function SeniorLayout({ children }: { children: React.ReactNode }) {
  const user = await requireSenior();

  return (
    <div data-surface="senior" className="min-h-screen bg-paper-100">
      {/* Navy header - strong visual anchor matching the homepage tone */}
      <header className="bg-navy-900">
        <div className="mx-auto flex max-w-[var(--container-default)] items-center justify-between gap-4 px-6 py-5">
          <Logo variant="wordmark" invert size={30} href="/home" />

          <div className="flex items-center gap-5">
            {user.displayName ? (
              <span className="text-[var(--text-senior-sm)] text-paper-400 hidden sm:inline tracking-wide">
                {user.displayName}
              </span>
            ) : null}
            <form action={signOut}>
              <SeniorButton type="submit" variant="ghost" size="md">
                Odhlásit se
              </SeniorButton>
            </form>
          </div>
        </div>

        {/* Gold accent line - mirrors the homepage's editorial gold accents */}
        <div
          aria-hidden
          className="h-[2px] bg-gradient-to-r from-transparent via-[var(--color-gold-400)] to-transparent opacity-70"
        />
      </header>

      <main className="mx-auto max-w-[var(--container-default)] px-6 py-10 sm:py-16">
        {children}
      </main>
    </div>
  );
}
