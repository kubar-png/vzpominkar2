import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireOwnerOfFamily } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AppPageHeader } from "@/components/app/AppPageHeader";
import { SeniorPasswordReset } from "./senior-password-reset";
import { SeniorMagicLink } from "./senior-magic-link";
import { SITE_HOST, SITE_URL } from "@/lib/site";

export const metadata: Metadata = { title: "Blízký" };

export default async function SeniorAdminPage({
  params,
  searchParams,
}: {
  params: Promise<{ familyId: string }>;
  searchParams: Promise<{ seniorId?: string }>;
}) {
  const { familyId } = await params;
  const { seniorId } = await searchParams;
  await requireOwnerOfFamily(familyId);

  const supabase = createAdminClient();
  let query = supabase
    .from("profiles")
    .select("id, display_name, username, created_at, magic_token")
    .eq("family_id", familyId)
    .eq("role", "senior");

  if (seniorId) {
    query = query.eq("id", seniorId);
  }

  const { data: senior } = await query.maybeSingle<{
    id: string;
    display_name: string | null;
    username: string | null;
    created_at: string;
    magic_token: string | null;
  }>();

  if (!senior) {
    // No storyteller yet — send them to the family page, where they can add one.
    redirect(`/family/${familyId}/rodina`);
  }

  return (
    <div className="space-y-10">
      <div>
        <Link
          href={`/family/${familyId}/rodina`}
          className="mb-4 inline-flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
        >
          <ArrowLeft size={12} />
          Zpět na rodinu
        </Link>
        <AppPageHeader
          title={senior.display_name ?? "Blízký"}
          description="Spravujte přihlašovací údaje a přístup k aplikaci."
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Přihlašovací údaje</CardTitle>
          <CardDescription>
            Váš blízký se přihlašuje na adrese{" "}
            <span className="font-mono text-[var(--color-text)]">
              {SITE_HOST}
              /senior-login
            </span>
            .
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4">
              <dt className="text-xs uppercase tracking-wider text-[var(--color-text-subtle)]">
                Uživatelské jméno
              </dt>
              <dd className="mt-1 font-mono text-xl">{senior.username}</dd>
            </div>
            <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4">
              <dt className="text-xs uppercase tracking-wider text-[var(--color-text-subtle)]">
                Heslo
              </dt>
              <dd className="mt-1 text-[var(--color-text-muted)]">
                Z bezpečnostních důvodů ho nezobrazíme. Pokud ho blízký zapomene,
                vygenerujte nové níže.
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {senior.magic_token ? (
        <Card>
          <CardHeader>
            <CardTitle>Odkaz pro vyprávějícího</CardTitle>
            <CardDescription>
              Tímto odkazem se váš blízký dostane rovnou ke svým otázkám — bez
              přihlašování. Pošlete mu ho v SMS nebo přes WhatsApp. Platí trvale;
              nepředávejte ho nikomu cizímu.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SeniorMagicLink url={`${SITE_URL}/q/${senior.magic_token}`} />
          </CardContent>
        </Card>
      ) : null}

      <SeniorPasswordReset familyId={familyId} seniorId={senior.id} username={senior.username ?? ""} />
    </div>
  );
}
