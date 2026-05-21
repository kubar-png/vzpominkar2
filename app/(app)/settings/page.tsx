import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, MessageSquare } from "lucide-react";
import { requireOwner } from "@/lib/auth/permissions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
        numeral="V"
        sectionLabel="Nastavení"
        title="Nastavení"
        description="Vaše údaje a způsob doručování otázek blízkému."
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
        <CardHeader>
          <CardTitle>Vaše jméno</CardTitle>
          <CardDescription>
            Jak vás aplikace osloví v přehledu a v emailech.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DisplayNameForm initial={owner.displayName ?? ""} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Změnit heslo</CardTitle>
          <CardDescription>
            Nové heslo musí mít alespoň 10 znaků. Po uložení vás Vzpomínkář ponechá přihlášené.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PasswordForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>E-mail</CardTitle>
          <CardDescription>Aktuální adresa: {owner.email}</CardDescription>
        </CardHeader>
        <CardContent>
          <EmailForm current={owner.email ?? null} />
        </CardContent>
      </Card>
    </div>
  );
}
