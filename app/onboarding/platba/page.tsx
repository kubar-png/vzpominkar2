import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Check } from "lucide-react";
import { requireOwner, hasActiveAccess } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { startBaseCheckout } from "@/lib/stripe/checkout";
import { priceForProductCzk } from "@/lib/stripe/server";
import { buttonVariants } from "@/components/ui/button";
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

  // The storyteller's name goes on the book cover for a bit of "this is yours".
  const admin = createAdminClient();
  const { data: family } = await admin
    .from("families")
    .select("senior_display_name")
    .eq("id", owner.familyId)
    .maybeSingle<{ senior_display_name: string | null }>();
  const seniorName = family?.senior_display_name?.trim() || null;

  const priceCzk = priceForProductCzk("book_base");

  return (
    <div className="space-y-10">
      {/* Progress strip — step two of two */}
      <div className="flex items-center gap-4">
        <span className="font-[family-name:var(--font-display)] text-2xl font-normal text-[var(--color-red-700)]">
          II.
        </span>
        <span className="text-[10px] uppercase tracking-[0.32em] text-[var(--color-text-muted)]">
          Krok 2 ze 2 · poslední
        </span>
        <div className="ml-2 flex flex-1 items-center gap-1.5">
          <span className="h-[2px] flex-1 bg-[var(--color-navy-700)]" />
          <span className="h-[2px] flex-1 bg-[var(--color-red-700)]" />
        </div>
      </div>

      <div className="space-y-5">
        <h1
          className="max-w-[20ch] font-[family-name:var(--font-display)] text-3xl font-normal leading-[1.1] tracking-tight text-[var(--color-ink-900)] sm:text-4xl"
          style={{ textWrap: "balance" }}
        >
          {seniorName ? `Kniha ${seniorName} je připravená.` : "Vaše kniha je připravená."}
        </h1>
        <p className="max-w-[52ch] font-[family-name:var(--font-display)] text-lg leading-relaxed text-[var(--color-text-muted)]">
          Zaplatíte jednou a přístup ke knize i&nbsp;online knihovně máte napořád
          — žádné předplatné. Pak už jen vybíráte otázky a&nbsp;sbíráte vzpomínky.
        </p>
      </div>

      {/* Navy conversion card — book on the left, the offer on the right. */}
      <div
        className="overflow-hidden rounded-[18px] bg-[var(--card-navy)] text-[var(--color-paper-100)]"
        style={{ boxShadow: "0 32px 64px -32px rgba(14,36,58,0.45)" }}
      >
        <div className="grid gap-9 p-7 sm:p-10 md:grid-cols-[210px_1fr] md:items-center md:gap-16">
          <BookCover seniorName={seniorName} />

          {/* Text stays left-aligned, but each block hugs the card's right edge. */}
          <div className="space-y-7">
            <div className="md:ml-auto md:w-fit">
              <span className="text-[10px] font-medium uppercase tracking-[0.28em] text-[var(--color-gold-300)]">
                Jednorázově · přístup napořád
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-[family-name:var(--font-display)] text-5xl font-medium leading-none text-[var(--color-gold-400)] sm:text-6xl">
                  {priceCzk > 0 ? priceCzk.toLocaleString("cs-CZ") : "Zdarma"}
                </span>
                {priceCzk > 0 ? (
                  <span className="font-[family-name:var(--font-display)] text-2xl text-[var(--color-paper-200)]">
                    Kč
                  </span>
                ) : null}
              </div>
            </div>

            <ul className="space-y-3 md:ml-auto md:w-fit">
              {INCLUDED.map((line) => (
                <li key={line} className="flex items-start gap-3 text-[15px] leading-snug text-[var(--color-paper-100)]">
                  <Check size={18} className="mt-0.5 shrink-0 text-[var(--color-gold-400)]" aria-hidden />
                  {line}
                </li>
              ))}
            </ul>

            <div className="flex flex-col gap-4 md:items-end">
              <form action={startBaseCheckout} className="w-full md:w-auto">
                <button
                  type="submit"
                  className={cn(buttonVariants({ variant: "primary", size: "lg" }), "w-full md:w-auto")}
                >
                  {priceCzk > 0 ? "Zaplatit a začít sbírat" : "Začít sbírat vzpomínky"}
                  <span
                    aria-hidden
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--card-navy)] text-[13px] font-semibold text-[var(--gold)]"
                  >
                    ↗
                  </span>
                </button>
              </form>
              {priceCzk > 0 ? (
                <p className="text-xs text-[var(--color-paper-300)] md:text-right">
                  Vrácení peněz do 30 dnů · bez závazku · platba přes zabezpečenou bránu
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Social proof — borrowed from the homepage, kept compact. */}
      <div className="space-y-3">
        <div className="flex items-center gap-2.5">
          <span aria-hidden className="text-[var(--color-gold-500)] tracking-[0.15em]">
            ★★★★★
          </span>
          <span className="text-sm text-[var(--color-text-muted)]">
            <strong className="font-semibold text-[var(--color-ink-900)]">Stovky rodin</strong>{" "}
            po celé republice
          </span>
        </div>
        <blockquote className="border-l-2 border-[var(--color-gold-400)] pl-4 text-[15px] leading-relaxed text-[var(--color-text-muted)]">
          „Babička loni odešla. Neměla jsem po ní jediný záznam. Dneska mám hodiny
          — a&nbsp;knihu, kterou děti otevřou kdykoliv.&rdquo;
        </blockquote>
      </div>
    </div>
  );
}

/**
 * Compact CSS book-cover mockup (leather + gold-stamped title), self-contained
 * so it scales down cleanly on mobile inside the navy card. Mirrors the
 * homepage hero book without depending on the .editorial cascade.
 */
function BookCover({ seniorName }: { seniorName: string | null }) {
  return (
    <div className="mx-auto w-[150px] shrink-0 sm:w-[176px]">
      <div
        className="relative flex aspect-[3/4] flex-col items-center justify-center gap-2.5 px-4 py-7 text-center"
        style={{
          background: "linear-gradient(160deg, #5d3a1e 0%, #432712 55%, #2c1a09 100%)",
          borderRadius: "3px 8px 8px 3px",
          boxShadow:
            "-3px 0 10px -3px rgba(0,0,0,.4), 0 24px 44px -18px rgba(20,15,10,.7), inset 0 0 0 1px rgba(0,0,0,.3)",
        }}
      >
        {/* gold inner frame */}
        <span
          className="pointer-events-none absolute inset-[9px] rounded-[2px]"
          style={{ border: "1.5px solid rgba(232,201,122,0.55)" }}
          aria-hidden
        />
        {/* spine shadow */}
        <span
          className="pointer-events-none absolute inset-y-0 left-0 w-[8px]"
          style={{ background: "linear-gradient(90deg, rgba(0,0,0,.32), transparent)", borderRadius: "3px 0 0 3px" }}
          aria-hidden
        />
        <span className="text-[8px] font-medium uppercase tracking-[0.4em] text-[rgba(232,201,122,0.8)]">
          Kniha vzpomínek
        </span>
        <span
          className="font-[family-name:var(--font-display)] text-[26px] leading-none text-[#e8c97a]"
          style={{ textShadow: "0 1px 0 rgba(0,0,0,.45)" }}
        >
          Vzpomínkář
        </span>
        {seniorName ? (
          <span className="max-w-full truncate text-[11px] text-[rgba(232,201,122,0.85)]">{seniorName}</span>
        ) : null}
        <span className="mt-0.5 text-[9px] uppercase tracking-[0.38em] text-[rgba(232,201,122,0.7)]">
          Díl 1 · 2026
        </span>
      </div>
    </div>
  );
}
