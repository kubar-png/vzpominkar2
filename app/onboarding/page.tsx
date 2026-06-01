import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { requireOwner } from "@/lib/auth/permissions";
import { OnboardingForm } from "./onboarding-form";

export const metadata: Metadata = { title: "Nastavení rodiny" };

// Fresh render every time so the familyId-based redirect can't act on stale
// client/route cache (which caused an /onboarding ↔ /credentials loop).
export const dynamic = "force-dynamic";

export default async function OnboardingStartPage() {
  const owner = await requireOwner();
  if (owner.familyId) redirect("/onboarding/platba");

  return (
    <div className="space-y-10">
      {/* Progress strip — two-step chapter bar */}
      <div className="flex items-center gap-4">
        <span className="font-[family-name:var(--font-display)] text-2xl font-normal text-[var(--color-red-700)]">
          I.
        </span>
        <span className="text-[10px] uppercase tracking-[0.32em] text-[var(--color-text-muted)]">
          Krok 1 ze 2 · zabere minutu
        </span>
        <div className="ml-2 flex flex-1 items-center gap-1.5">
          <span className="h-[2px] flex-1 bg-[var(--color-red-700)]" />
          <span className="h-[2px] flex-1 bg-[var(--color-paper-300)]" />
        </div>
      </div>

      <div className="space-y-5">
        <h1
          className="max-w-[20ch] font-[family-name:var(--font-display)] text-3xl font-normal leading-[1.1] tracking-tight text-[var(--color-ink-900)] sm:text-4xl"
          style={{ textWrap: "balance" }}
        >
          Začneme tím, kdo bude vyprávět.
        </h1>
        <p className="max-w-[52ch] font-[family-name:var(--font-display)] text-lg leading-relaxed text-[var(--color-text-muted)]">
          Stačí jméno blízkého, jehož příběhy chcete zachytit. Za pár týdnů
          z&nbsp;jeho vyprávění vznikne kniha pro celou rodinu — otázky i&nbsp;přístup
          pro něj vyřešíte hned potom, v&nbsp;klidu a&nbsp;bez spěchu.
        </p>
      </div>

      <OnboardingForm />
    </div>
  );
}
