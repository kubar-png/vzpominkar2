import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, MessageSquare, Compass } from "lucide-react";
import { requireOwner } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { FormSection } from "@/components/ui/form-section";
import { AppPageHeader } from "@/components/app/AppPageHeader";
import { AutoScheduleToggle } from "@/components/app/AutoScheduleToggle";
import { DisplayNameForm } from "./display-name-form";
import { PasswordForm } from "./password-form";
import { EmailForm } from "./email-form";

export const metadata: Metadata = { title: "Nastavení" };

export default async function SettingsPage() {
  const owner = await requireOwner();

  let autoSchedule = true;
  if (owner.familyId) {
    const { data: fam } = await createAdminClient()
      .from("families")
      .select("auto_schedule_prompts")
      .eq("id", owner.familyId)
      .maybeSingle<{ auto_schedule_prompts: boolean }>();
    autoSchedule = fam?.auto_schedule_prompts ?? true;
  }

  return (
    <div className="space-y-8">
      <AppPageHeader
        title="Nastavení"
        description="Jak se vám rodina v aplikaci představuje."
      />

      {/* Cross-link to delivery settings — quiet row, not a CTA. */}
      <Link
        href="/settings/otazky"
        className="group flex items-center justify-between rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-white px-5 py-4 transition-colors hover:border-[var(--color-paper-300)]"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-paper-100)] text-[var(--color-navy-700)]">
            <MessageSquare size={16} aria-hidden />
          </span>
          <div>
            <p className="text-[15px] font-semibold text-[var(--color-navy-900)]">
              Nastavení otázek
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">
              Kam a jak často posílat otázky blízkému.
            </p>
          </div>
        </div>
        <ChevronRight
          size={16}
          className="text-[var(--color-text-subtle)] transition-transform group-hover:translate-x-0.5"
          aria-hidden
        />
      </Link>

      {/* Replay the first-run dashboard tour (?tour=1 force-shows it). */}
      <Link
        href="/dashboard?tour=1"
        className="group flex items-center justify-between rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-white px-5 py-4 transition-colors hover:border-[var(--color-paper-300)]"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-paper-100)] text-[var(--color-navy-700)]">
            <Compass size={16} aria-hidden />
          </span>
          <div>
            <p className="text-[15px] font-semibold text-[var(--color-navy-900)]">
              Spustit prohlídku znovu
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">
              Krátké provedení dashboardem, kde co najdete.
            </p>
          </div>
        </div>
        <ChevronRight
          size={16}
          className="text-[var(--color-text-subtle)] transition-transform group-hover:translate-x-0.5"
          aria-hidden
        />
      </Link>

      {owner.familyId ? (
        <AutoScheduleToggle familyId={owner.familyId} initial={autoSchedule} />
      ) : null}

      <section className="space-y-6 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-white p-5 md:p-6">
        <FormSection
          title="Vaše jméno"
          description="Jak vás aplikace osloví v přehledu a v e-mailech."
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
          description="Nové heslo musí mít alespoň 10 znaků. Po uložení zůstanete přihlášeni."
        >
          <PasswordForm />
        </FormSection>
      </section>
    </div>
  );
}
