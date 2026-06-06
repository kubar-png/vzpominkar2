import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, UserPlus } from "lucide-react";
import { requireOwner } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { AppPageHeader } from "@/components/app/AppPageHeader";
import { EmptyState } from "@/components/app/EmptyState";
import { DeliveryForm } from "./delivery-form";

export const metadata: Metadata = { title: "Nastavení otázek" };

type Senior = {
  id: string;
  display_name: string | null;
  senior_role: string | null;
  contact_channel: string | null;
  contact_address: string | null;
  phone_e164: string | null;
  prompt_frequency: number;
};

export default async function OtazkySettingsPage() {
  const owner = await requireOwner();

  let seniors: Senior[] = [];

  if (owner.familyId) {
    const admin = createAdminClient();
    const { data } = await admin
      .from("profiles")
      .select("id, display_name, senior_role, contact_channel, contact_address, phone_e164, prompt_frequency")
      .eq("family_id", owner.familyId)
      .eq("role", "senior")
      .order("created_at")
      .returns<Senior[]>();
    seniors = data ?? [];
  }

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/settings"
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-navy-700)]"
        >
          <ArrowLeft size={14} aria-hidden />
          Nastavení
        </Link>
        <AppPageHeader
          title="Nastavení otázek"
          description="Kam a jak často se otázky doručují každému z vašich blízkých."
        />
      </div>

      {owner.familyId === null ? (
        <p className="text-sm text-[var(--color-text-muted)]">
          Nejprve dokončete registraci a přidejte blízkého.
        </p>
      ) : seniors.length === 0 ? (
        <EmptyState
          icon={<UserPlus size={18} aria-hidden />}
          title="Zatím žádný blízký"
          description="Přidejte blízkého — pak se zde objeví jeho doručovací nastavení."
          action={
            <Link
              href={`/family/${owner.familyId}/rodina`}
              className="inline-flex h-10 items-center rounded-full bg-[var(--color-gold-500)] px-5 text-sm font-semibold text-[var(--color-navy-900)] transition-colors hover:bg-[var(--color-gold-400)]"
            >
              Přidat blízkého
              <span aria-hidden className="ml-1">↗</span>
            </Link>
          }
        />
      ) : (
        <div className="space-y-6">
          {seniors.map((senior) => (
            <section
              key={senior.id}
              className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-white"
            >
              <header className="border-b border-[var(--color-border)] px-5 py-4 md:px-6">
                <p className="text-[17px] font-semibold tracking-tight text-[var(--color-navy-900)]">
                  {senior.display_name ?? "Blízký"}
                </p>
                {senior.senior_role ? (
                  <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                    {senior.senior_role}
                  </p>
                ) : null}
              </header>
              <div className="p-5 md:p-6">
                <DeliveryForm familyId={owner.familyId!} senior={senior} />
              </div>
            </section>
          ))}

          <p className="text-xs text-[var(--color-text-subtle)]">
            Doručování přes WhatsApp je momentálně ve vývoji - zatím doporučujeme zvolit e-mail.
          </p>
        </div>
      )}
    </div>
  );
}
