import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, MessageSquare } from "lucide-react";
import { requireOwner } from "@/lib/auth/permissions";
import { Card, CardContent } from "@/components/ui/card";
import { FormSection } from "@/components/ui/form-section";
import { AppPageHeader } from "@/components/app/AppPageHeader";
import { DisplayNameForm } from "./display-name-form";
import { PasswordForm } from "./password-form";
import { EmailForm } from "./email-form";

export const metadata: Metadata = { title: "Nastavení" };

export default async function SettingsPage() {
  const owner = await requireOwner();

  return (
    <div className="space-y-10">
      <AppPageHeader
        numeral="VI"
        sectionLabel="Nastavení"
        title="Nastavení"
        description="Jak se vám rodina v aplikaci představuje a jak chodí otázky."
      />

      <Link
        href="/settings/otazky"
        className="flex items-center justify-between rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-navy-50)] px-5 py-4 transition-colors hover:border-[var(--color-navy-300)] hover:bg-[var(--color-navy-100)]/60"
      >
        <div className="flex items-center gap-3">
          <MessageSquare size={16} className="text-[var(--color-navy-700)]" />
          <div>
            <p className="text-sm font-medium text-[var(--color-navy-900)]">Nastavení otázek</p>
            <p className="text-xs text-[var(--color-text-muted)]">Kam a jak často posílat otázky blízkému</p>
          </div>
        </div>
        <ChevronRight size={16} className="text-[var(--color-text-subtle)]" />
      </Link>

      <Card>
        <CardContent className="space-y-8 p-6">
          <FormSection
            title="Vaše jméno"
            description="Jak vás aplikace osloví v přehledu a v emailech."
            hideDivider
          >
            <DisplayNameForm initial={owner.displayName ?? ""} />
          </FormSection>

          <FormSection
            title="E-mail"
            description={`Aktuální adresa: ${owner.email ?? "—"}`}
          >
            <EmailForm current={owner.email ?? null} />
          </FormSection>

          <FormSection
            title="Heslo"
            description="Nové heslo musí mít alespoň 10 znaků. Po uložení vás Vzpomínkář ponechá přihlášené."
          >
            <PasswordForm />
          </FormSection>
        </CardContent>
      </Card>
    </div>
  );
}
