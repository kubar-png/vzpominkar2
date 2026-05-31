import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { requireOwner } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { CredentialsForm } from "./credentials-form";

export const metadata: Metadata = { title: "Přístup pro seniora" };

// Always render fresh: the redirects depend on the owner's just-created
// family/senior state, which a stale client/route cache would get wrong.
export const dynamic = "force-dynamic";

export default async function CredentialsPage() {
  const owner = await requireOwner();
  if (!owner.familyId) redirect("/onboarding");

  // Read via the admin client (like the rest of the app). owner.familyId is
  // already validated; an RLS read here could intermittently return null right
  // after creation and ping-pong /onboarding ↔ /credentials.
  const admin = createAdminClient();
  const { data: family } = await admin
    .from("families")
    .select("id, name, senior_display_name")
    .eq("id", owner.familyId)
    .maybeSingle<{ id: string; name: string; senior_display_name: string | null }>();

  if (!family) redirect("/onboarding");

  const { data: senior } = await admin
    .from("profiles")
    .select("id")
    .eq("family_id", family.id)
    .eq("role", "senior")
    .maybeSingle<{ id: string }>();

  if (senior) redirect("/dashboard");

  const seniorName = family.senior_display_name ?? "seniora";

  return (
    <div className="space-y-10">
      <div className="flex items-center gap-4">
        <span className="font-[family-name:var(--font-display)] text-2xl font-normal text-[var(--color-red-700)]">
          II.
        </span>
        <span className="text-[10px] uppercase tracking-[0.32em] text-[var(--color-text-muted)]">
          Krok druhý ze dvou
        </span>
        <div className="ml-2 flex flex-1 items-center gap-1.5">
          <span className="h-[2px] flex-1 bg-[var(--color-navy-700)]" />
          <span className="h-[2px] flex-1 bg-[var(--color-red-700)]" />
        </div>
      </div>

      <div className="space-y-5">
        <h1
          className="max-w-[24ch] font-[family-name:var(--font-display)] text-3xl font-normal leading-[1.1] tracking-tight text-[var(--color-ink-900)] sm:text-4xl"
          style={{ textWrap: "balance" }}
        >
          Vytvořte přístup pro svého blízkého.
        </h1>
        <p className="max-w-[52ch] font-[family-name:var(--font-display)] text-lg leading-relaxed text-[var(--color-text-muted)]">
          Vyberte uživatelské jméno a&nbsp;heslo, kterými se {seniorName} přihlásí.
          Zapište si je nebo vytiskněte - uvidíte je hned po vytvoření,
          později jen vy je můžete změnit.
        </p>
      </div>

      <CredentialsForm
        familyId={family.id}
        seniorDisplayName={family.senior_display_name ?? ""}
      />
    </div>
  );
}
