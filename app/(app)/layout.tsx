import { Toaster } from "sonner";
import { requireOwner } from "@/lib/auth/permissions";
import { AppSidebar } from "@/components/app/AppSidebar";
import { AppMobileMenu } from "@/components/app/AppMobileMenu";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireOwner();

  return (
    <div className="flex min-h-screen bg-[var(--color-paper-50)]">
      {/* Desktop sidebar */}
      <AppSidebar
        familyId={user.familyId}
        displayName={user.displayName}
        email={user.email}
      />

      {/* Mobile header + right-side drawer */}
      <AppMobileMenu
        familyId={user.familyId}
        displayName={user.displayName}
        email={user.email}
      />

      {/* Main content area. Book progress now lives in /dashboard (mini-card)
       * and in /prompts header action slot — no longer a global sticky bar. */}
      <div className="flex min-h-screen w-full flex-col md:ml-[280px]">
        <main className="flex-1 px-5 py-6 pt-[calc(3.5rem+1.25rem)] md:px-10 md:py-10 md:pt-10 max-w-[980px]">
          {children}
        </main>
      </div>

      {/* Toast feedback — bottom-right desktop, top-center mobile. Cream
       * background with gold/oxblood accent in the icon to match the
       * editorial system. */}
      <Toaster
        position="bottom-right"
        mobileOffset={{ top: "1rem" }}
        toastOptions={{
          classNames: {
            toast:
              "!bg-[var(--color-paper-50)] !text-[var(--color-text)] !border-[var(--color-border)] !shadow-[var(--shadow-md)] !rounded-[var(--radius-md)]",
            title: "!font-medium",
            success: "!text-[var(--color-text)]",
            error: "!text-[var(--color-red-800)]",
          },
        }}
        icons={{
          success: (
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden fill="none">
              <polygon points="7,1 13,7 7,13 1,7" stroke="var(--color-gold-500)" strokeWidth="1.3" fill="var(--color-gold-100)" />
              <path d="M4.5 7 L6.5 9 L9.5 5.5" stroke="var(--color-navy-900)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          ),
          error: (
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden fill="none">
              <polygon points="7,1 13,7 7,13 1,7" stroke="var(--color-red-700)" strokeWidth="1.3" fill="var(--color-red-50)" />
              <path d="M7 4 V8 M7 10 V10.5" stroke="var(--color-red-800)" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          ),
        }}
      />
    </div>
  );
}
