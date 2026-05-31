import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireOwner } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { saveReferralSource } from "@/lib/onboarding/actions";
import { REFERRAL_SOURCES } from "@/lib/onboarding/referral";

export const metadata: Metadata = { title: "Jak jste se o nás dozvěděli?" };

/**
 * Acquisition attribution — shown once right after the owner's first purchase
 * (base activation). Saves to families.referral_source; re-visiting once it's
 * set bounces to the dashboard. Skippable.
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
    <div className="editorial">
      <section className="auth-shell">
        <div className="auth-card">
          <span className="auth-eyebrow">Poslední krok</span>
          <h1 className="auth-title">Jak jste se o Vzpomínkáři dozvěděli?</h1>
          <p className="auth-lede">
            Díky tomu víme, co funguje, a můžeme se zlepšovat. Vyberte, co nejvíc
            sedí.
          </p>

          <form action={saveReferralSource} className="mt-6 flex flex-col gap-2">
            {REFERRAL_SOURCES.map((s) => (
              <label
                key={s.value}
                className="flex cursor-pointer items-center gap-3 rounded-[8px] border border-[var(--line-2)] px-4 py-3 text-left text-[16px] text-[var(--ink)] transition-colors hover:border-[var(--ink)] has-[:checked]:border-[var(--ink)] has-[:checked]:bg-[var(--paper)]"
              >
                <input
                  type="radio"
                  name="source"
                  value={s.value}
                  required
                  className="h-4 w-4 accent-[var(--gold)]"
                />
                <span>{s.label}</span>
              </label>
            ))}

            <button type="submit" className="btn btn-gold mt-4 justify-center">
              Pokračovat <span className="arrow">↗</span>
            </button>
          </form>

          <div className="auth-meta" style={{ textAlign: "center" }}>
            <Link href="/dashboard" className="auth-back">
              Přeskočit
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
