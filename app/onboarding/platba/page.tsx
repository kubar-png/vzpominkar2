import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Check } from "lucide-react";
import { requireOwner, hasActiveAccess } from "@/lib/auth/permissions";
import { startBaseCheckout } from "@/lib/stripe/checkout";
import { priceForProductCzk } from "@/lib/stripe/server";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Aktivace přístupu" };

// Fresh render — the redirect depends on the family's just-changed access state.
export const dynamic = "force-dynamic";

const INCLUDED = [
  "Jeden blízký a jeho kniha — až 52 otázek",
  "Doživotní přístup, žádné předplatné",
  "Online knihovna pro celou rodinu",
  "Automatický přepis a korektura odpovědí",
];

export default async function ActivationPage() {
  const owner = await requireOwner();
  if (!owner.familyId) redirect("/onboarding");
  // Already paid → no paywall, straight on.
  if (hasActiveAccess(owner)) redirect("/dashboard");

  const priceCzk = priceForProductCzk("book_base");

  return (
    <div className="space-y-10">
      {/* Progress strip — step three of three */}
      <div className="flex items-center gap-4">
        <span className="font-[family-name:var(--font-display)] text-2xl font-normal text-[var(--color-red-700)]">
          III.
        </span>
        <span className="text-[10px] uppercase tracking-[0.32em] text-[var(--color-text-muted)]">
          Krok třetí ze tří
        </span>
        <div className="ml-2 flex flex-1 items-center gap-1.5">
          <span className="h-[2px] flex-1 bg-[var(--color-navy-700)]" />
          <span className="h-[2px] flex-1 bg-[var(--color-navy-700)]" />
          <span className="h-[2px] flex-1 bg-[var(--color-red-700)]" />
        </div>
      </div>

      <div className="space-y-5">
        <h1
          className="max-w-[24ch] font-[family-name:var(--font-display)] text-3xl font-normal leading-[1.1] tracking-tight text-[var(--color-ink-900)] sm:text-4xl"
          style={{ textWrap: "balance" }}
        >
          Aktivujte přístup ke knize.
        </h1>
        <p className="max-w-[52ch] font-[family-name:var(--font-display)] text-lg leading-relaxed text-[var(--color-text-muted)]">
          Zaplatíte jednou a přístup ke knize i&nbsp;online knihovně máte napořád
          — žádné předplatné. Pak už můžete vybírat otázky a&nbsp;sbírat
          vzpomínky.
        </p>
      </div>

      <Card>
        <CardContent className="space-y-6 p-7">
          <div className="flex items-baseline justify-between gap-4 border-b border-[var(--color-border)] pb-5">
            <span className="font-[family-name:var(--font-display)] text-lg font-medium text-[var(--color-ink-900)]">
              Přístup ke knize
            </span>
            <span className="font-[family-name:var(--font-display)] text-2xl font-medium text-[var(--color-ink-900)]">
              {priceCzk > 0 ? `${priceCzk.toLocaleString("cs-CZ")} Kč` : "Zdarma"}
            </span>
          </div>

          <ul className="space-y-2.5">
            {INCLUDED.map((line) => (
              <li key={line} className="flex items-start gap-2.5 text-[15px] text-[var(--color-text)]">
                <Check
                  size={18}
                  className="mt-0.5 shrink-0 text-[var(--color-gold-600)]"
                  aria-hidden
                />
                {line}
              </li>
            ))}
          </ul>

          {owner.emailVerified ? (
            <>
              <form action={startBaseCheckout}>
                <button
                  type="submit"
                  className={cn(buttonVariants({ variant: "primary", size: "lg" }), "w-full justify-center")}
                >
                  {priceCzk > 0 ? "Zaplatit a aktivovat" : "Aktivovat přístup"}
                  <span aria-hidden>↗</span>
                </button>
              </form>

              {priceCzk > 0 ? (
                <p className="text-center text-xs text-[var(--color-text-muted)]">
                  Vrácení peněz do 30 dnů, bez závazku.
                </p>
              ) : null}
            </>
          ) : (
            <div className="space-y-2">
              <button
                type="button"
                disabled
                className={cn(
                  buttonVariants({ variant: "primary", size: "lg" }),
                  "w-full cursor-not-allowed justify-center opacity-60",
                )}
              >
                Nejdřív ověřte e-mail
              </button>
              <p className="text-center text-xs text-[var(--color-text-muted)]">
                Aktivaci odemknete po kliknutí na ověřovací odkaz, který jsme vám poslali
                e-mailem (viz pruh nahoře).
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
