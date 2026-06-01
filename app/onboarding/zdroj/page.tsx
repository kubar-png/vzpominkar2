import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Search,
  Sparkles,
  Users,
  Newspaper,
  Share2,
  MoreHorizontal,
  Check,
  type LucideIcon,
} from "lucide-react";
import { requireOwner } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { saveReferralSource } from "@/lib/onboarding/actions";
import { REFERRAL_SOURCES } from "@/lib/onboarding/referral";

export const metadata: Metadata = { title: "Jak jste se o nás dozvěděli?" };

const ICONS: Record<string, LucideIcon> = {
  social: Share2,
  google: Search,
  ai: Sparkles,
  friend: Users,
  media: Newspaper,
  other: MoreHorizontal,
};

/**
 * Acquisition attribution — shown once right after the owner's first purchase
 * (base activation). Lives inside the onboarding layout (full-page bg +
 * wordmark header), so it matches the rest of the flow. Saves to
 * families.referral_source; re-visiting once set bounces to the dashboard.
 */
export default async function ReferralPage() {
  const owner = await requireOwner();
  if (!owner.familyId) redirect("/onboarding");

  const admin = createAdminClient();
  const { data: family } = await admin
    .from("families")
    .select("referral_source")
    .eq("id", owner.familyId)
    .maybeSingle<{ referral_source: string | null }>();
  if (family?.referral_source) redirect("/dashboard");

  return (
    <div className="space-y-10">
      {/* Post-purchase: the funnel is done (payment was the last step). This
       * is an optional extra, NOT a counted step — so no step bar / "krok". */}
      <div className="flex items-center gap-3">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-gold-100)] text-[var(--color-gold-600)]">
          <Check size={14} aria-hidden />
        </span>
        <span className="text-[10px] uppercase tracking-[0.32em] text-[var(--color-text-muted)]">
          Hotovo · ještě jedna nepovinná otázka
        </span>
      </div>

      <div className="space-y-5">
        <h1
          className="max-w-[24ch] font-[family-name:var(--font-display)] text-3xl font-normal leading-[1.1] tracking-tight text-[var(--color-ink-900)] sm:text-4xl"
          style={{ textWrap: "balance" }}
        >
          Jak jste se o Vzpomínkáři dozvěděli?
        </h1>
        <p className="max-w-[52ch] font-[family-name:var(--font-display)] text-lg leading-relaxed text-[var(--color-text-muted)]">
          Díky tomu víme, co funguje, a&nbsp;můžeme se zlepšovat. Vyberte, co
          nejvíc sedí.
        </p>
      </div>

      <form action={saveReferralSource} className="space-y-8">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {REFERRAL_SOURCES.map((s) => {
            const Icon = ICONS[s.value] ?? MoreHorizontal;
            return (
              <label
                key={s.value}
                className="group flex cursor-pointer flex-col items-center gap-3 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-6 text-center transition-colors hover:border-[var(--color-navy-400)] has-[:checked]:border-[var(--color-navy-700)] has-[:checked]:bg-[var(--color-navy-50)]"
              >
                <input type="radio" name="source" value={s.value} required className="sr-only" />
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-paper-100)] text-[var(--color-navy-700)] transition-colors group-has-[:checked]:bg-[var(--color-navy-700)] group-has-[:checked]:text-white">
                  <Icon size={22} aria-hidden />
                </span>
                <span className="text-sm font-medium leading-snug text-[var(--color-text)]">
                  {s.label}
                </span>
              </label>
            );
          })}
        </div>

        <div className="flex items-center justify-between gap-4">
          <Link
            href="/dashboard"
            className="text-sm text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
          >
            Přeskočit
          </Link>
          <button type="submit" className={cn(buttonVariants({ variant: "primary" }))}>
            Pokračovat <span aria-hidden>↗</span>
          </button>
        </div>
      </form>
    </div>
  );
}
