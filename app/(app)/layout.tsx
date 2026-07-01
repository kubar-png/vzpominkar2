import { Suspense } from "react";
import { Toaster } from "sonner";
import { requireActiveOwner } from "@/lib/auth/permissions";
import { AppSidebar } from "@/components/app/AppSidebar";
import { AppMobileMenu } from "@/components/app/AppMobileMenu";
import {
  BookProgressBarAsync,
  BookProgressBarSkeleton,
} from "@/components/app/BookProgressBar";
import {
  StatsSidebarAsync,
  StatsSidebarSkeleton,
} from "@/components/app/StatsSidebar";
import { VerifyEmailNotice } from "@/components/app/VerifyEmailNotice";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Auth has to resolve before we can show the shell at all (gating),
  // but everything else (stats, progress) streams in via <Suspense> so the
  // sidebar + main column paint immediately on every navigation.
  const user = await requireActiveOwner();

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
            <VerifyEmailNotice />
            {children}
          </main>
          {user.familyId ? (
            <Suspense fallback={<StatsSidebarSkeleton />}>
              <StatsSidebarAsync familyId={user.familyId} />
            </Suspense>
          ) : null}
        </div>

        {/* Global book progress — visible on desktop AND mobile per user
         * request. Renders as a sticky bottom strip in every owner-app page. */}
        {user.familyId && (
          <Suspense fallback={<BookProgressBarSkeleton />}>
            <BookProgressBarAsync familyId={user.familyId} />
          </Suspense>
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
            error: "!text-[#b3241c]",
          },
        }}
        icons={{
          success: (
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden fill="none">
              <polygon points="7,1 13,7 7,13 1,7" stroke="var(--color-success)" strokeWidth="1.3" fill="#e4f0e9" />
              <path d="M4.5 7 L6.5 9 L9.5 5.5" stroke="var(--color-success)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          ),
          error: (
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden fill="none">
              <polygon points="7,1 13,7 7,13 1,7" stroke="#b3241c" strokeWidth="1.3" fill="#f7e7e5" />
              <path d="M7 4 V8 M7 10 V10.5" stroke="#b3241c" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          ),
        }}
      />
    </div>
  );
}
