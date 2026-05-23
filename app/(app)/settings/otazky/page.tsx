import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireOwner } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AppPageHeader } from "@/components/app/AppPageHeader";
import { DeliveryForm } from "./delivery-form";

export const metadata: Metadata = { title: "Nastavení otázek" };

type Senior = {
  id: string;
  display_name: string | null;
  senior_role: string | null;
  contact_channel: string | null;
  contact_address: string | null;
  prompt_frequency: number;
};

export default async function OtazkySettingsPage() {
  const owner = await requireOwner();

  let seniors: Senior[] = [];

  if (owner.familyId) {
    const admin = createAdminClient();
    const { data } = await admin
      .from("profiles")
      .select("id, display_name, senior_role, contact_channel, contact_address, prompt_frequency")
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
          className="mb-4 inline-flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
        >
          <ArrowLeft size={12} />
          Zpět na nastavení
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
        <Card>
          <CardContent className="py-12 text-center text-[var(--color-text-muted)]">
            Zatím žádný blízký.{" "}
            <Link
              href={`/family/${owner.familyId}/rodina`}
              className="underline underline-offset-2 hover:text-[var(--color-text)]"
            >
              Přidat blízkého
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {seniors.map((senior) => (
            <Card key={senior.id}>
              <CardHeader>
                <CardTitle className="font-[family-name:var(--font-display)] text-xl">
                  {senior.display_name ?? "Blízký"}
                </CardTitle>
                {senior.senior_role ? (
                  <CardDescription className="text-xs font-medium uppercase tracking-widest text-[var(--color-gold-500)]">
                    {senior.senior_role}
                  </CardDescription>
                ) : null}
              </CardHeader>
              <CardContent>
                <DeliveryForm familyId={owner.familyId!} senior={senior} />
              </CardContent>
            </Card>
          ))}

          <p className="text-xs text-[var(--color-text-subtle)]">
            Doručování přes WhatsApp je momentálně ve vývoji - zatím doporučujeme zvolit e-mail.
          </p>
        </div>
      )}
    </div>
  );
}
