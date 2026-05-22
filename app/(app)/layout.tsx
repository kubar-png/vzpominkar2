import { requireOwner } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { AppSidebar } from "@/components/app/AppSidebar";
import { AppMobileMenu } from "@/components/app/AppMobileMenu";
import { BookProgressBar } from "@/components/app/BookProgressBar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireOwner();

  let memoryCount = 0;
  if (user.familyId) {
    const supabase = createAdminClient();
    const { count } = await supabase
      .from("memories")
      .select("id", { count: "exact", head: true })
      .eq("family_id", user.familyId)
      .eq("status", "published");
    memoryCount = count ?? 0;
  }

  return (
    <div className="flex min-h-screen bg-[var(--color-bg)]">
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

      {/* Main content area */}
      <div className="flex min-h-screen w-full flex-col md:ml-[280px]">
        {/*
          Mobile: pt-14 to clear the fixed header bar.
          Desktop: no top padding - sidebar handles branding.
        */}
        <main className="flex-1 px-5 py-6 pt-[calc(3.5rem+1.25rem)] md:px-10 md:py-10 md:pt-10 max-w-[980px]">
          {children}
        </main>

        {/* Progress bar - desktop only */}
        {user.familyId && (
          <div className="hidden md:block">
            <BookProgressBar count={memoryCount} familyId={user.familyId} />
          </div>
        )}
      </div>
    </div>
  );
}
