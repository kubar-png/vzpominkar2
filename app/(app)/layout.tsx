import { Toaster } from "sonner";
import { requireOwner } from "@/lib/auth/permissions";
import { AppSidebar } from "@/components/app/AppSidebar";
import { AppMobileMenu } from "@/components/app/AppMobileMenu";
import { BookProgressBar } from "@/components/app/BookProgressBar";
import { StatsSidebar } from "@/components/app/StatsSidebar";
import { getFamilyStats } from "@/lib/family/stats";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireOwner();
  const stats = await getFamilyStats(user.familyId);

  return (
    <div className="flex min-h-screen overflow-x-clip bg-[var(--color-paper-50)]">
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

      {/* Main content area + right stats card. Bottom padding accounts for
       * the sticky BookProgressBar (~64px) on both desktop and mobile.
       * `min-w-0` on the flex wrapper + main is critical: without it, any
       * wide child (FlipBook, long URL, code block) forces main wider than
       * the viewport and the page scrolls horizontally on phones. */}
      <div className="flex min-h-screen w-full min-w-0 flex-col md:ml-[280px]">
        <div className="flex min-w-0 flex-1">
          <main className="min-w-0 flex-1 max-w-[980px] px-5 py-6 pt-[calc(3.5rem+1.25rem)] pb-24 md:px-10 md:py-10 md:pt-10">
            {children}
          </main>
          {user.familyId ? <StatsSidebar stats={stats} /> : null}
        </div>

        {/* Global book progress — visible on desktop AND mobile per user
         * request. Renders as a sticky bottom strip in every owner-app page. */}
        {user.familyId && (
          <BookProgressBar count={stats.memoryCount} familyId={user.familyId} />
        )}
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
