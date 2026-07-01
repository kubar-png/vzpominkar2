import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Check } from "lucide-react";
import { requireOwner, hasActiveAccess } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { startBaseCheckout } from "@/lib/stripe/checkout";
import { validateCoupon, normalizeCouponCode } from "@/lib/coupons/server";
import {
  priceForProductCzk,
  discountedExtraCopyCzk,
  assertDisplayPriceMatchesCharged,
} from "@/lib/stripe/server";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { readGiftState } from "@/lib/gift/cookie";
import { VoucherConfigurator } from "@/app/darovat/_components/VoucherConfigurator";
import { CouponField } from "./coupon-field";

export const metadata: Metadata = { title: "Aktivace přístupu" };

// Fresh render — the redirect depends on the family's just-changed access state.
export const dynamic = "force-dynamic";

const INCLUDED = [
  "Jeden blízký a jeho kniha — až 52 otázek",
  "První tištěná kniha v ceně — žádný další poplatek za tisk",
  "Doživotní přístup, žádné předplatné",
  "Online knihovna pro celou rodinu",
  "Automatický přepis a korektura odpovědí",
];

// The real one-time price the buyer is committing to. Shown for trust even on
// the free path (dev / launch promo), where priceForProductCzk returns 0.
const BASE_PRICE_TRUST_CZK = 2890;

export default async function ActivationPage({
  searchParams,
}: {
  searchParams: Promise<{ cancelled?: string; coupon?: string }>;
}) {
  const sp = await searchParams;
  const cancelled = sp.cancelled === "1";
  // A coupon may arrive pre-filled in the URL (e.g. an autoresponder link like
  // ?coupon=VITEJTE200). Normalize for display/prefill; re-validate below.
  const prefillCoupon = sp.coupon ? normalizeCouponCode(sp.coupon) : "";

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
  // Display price: the real amount on a paid setup, the trust price on free path.
  // This page is the ONE sanctioned exception to "display === charged": on the
  // free path we deliberately show BASE_PRICE_TRUST_CZK next to a *non-payment*
  // CTA ("Začít sbírat vzpomínky"), so the buyer is never told they're being
  // charged. So when a real charged price IS configured we still assert it
  // equals what we show; when it's 0 we pass the charged 0 as the display, which
  // is correct — the trust price isn't a charge.
  const displayPriceCzk = priceCzk > 0 ? priceCzk : BASE_PRICE_TRUST_CZK;
  // Guard the only failure mode we can't tolerate here: a configured charged
  // price that silently disagrees with the displayed one.
  assertDisplayPriceMatchesCharged(
    priceCzk > 0 ? displayPriceCzk : 0,
    priceCzk,
    "onboarding/platba book_base",
  );

  // Order bump — a second printed copy at the launch discount. Hidden entirely
  // when the env price is unset (would render a meaningless "0 Kč").
  const extraCopyCzk = discountedExtraCopyCzk();
  const showExtraCopyBump = extraCopyCzk > 0;

  // Coupon — re-validate the (possibly URL-prefilled) code SERVER-SIDE so what
  // we show equals what the action will charge. A discount only changes the
  // shown total on a REAL charged setup (priceCzk > 0); on the free path the
  // book is already free and showing "−200 Kč off 2 890 Kč" would imply a
  // charge that never happens, so we keep the field (the code is still recorded
  // as redeemed on completion) but don't render a misleading discounted total.
  let couponDiscountCzk = 0;
  if (prefillCoupon && priceCzk > 0) {
    const result = await validateCoupon(admin, {
      code: prefillCoupon,
      productType: "book_base",
      subtotalCzk: priceCzk,
    });
    if (result.ok) {
      couponDiscountCzk = Math.min(result.amountOffCzk, priceCzk);
    }
  }
  // The amount the buyer will actually be charged for the base book (clamped).
  const chargedAfterCouponCzk = Math.max(0, priceCzk - couponDiscountCzk);
  const hasAppliedDiscount = couponDiscountCzk > 0;

  // Gift flow (from /darovat → /signup?gift=1, marked through onboarding): show
  // the dárkový poukaz configurator inside the paywall form so the buyer pays
  // ASAP and walks away with a printable card. Its fields (voucher_*) ride the
  // same submit — startBaseCheckout reads them, mints the voucher, and threads
  // its token into the payment so the confirmation screen can offer the PDF.
  const { isGift } = await readGiftState();

  return (
    <div className="space-y-10">
      {/* Calm reassurance after an abandoned Stripe checkout — no alarm, no
          exclamation. The book is held, nothing is lost. */}
      {cancelled ? (
        <p
          role="status"
          className="rounded-[var(--radius-md)] border border-[var(--color-navy-200)] bg-[var(--color-navy-50)] px-4 py-3 text-sm leading-relaxed text-[var(--color-navy-800)]"
        >
          {seniorName
            ? `Platbu jste nedokončili — kniha ${seniorName} na vás počká.`
            : "Platbu jste nedokončili — vaše kniha na vás počká."}
        </p>
      ) : null}

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

          {/* Text stays left-aligned, but each block hugs the card's right edge.
              The price is intentionally not shown here — the exact charged
              amount (when any) lives on the CTA below. */}
          <div className="space-y-7">
            <ul className="space-y-3 md:ml-auto md:w-fit">
              {INCLUDED.map((line) => (
                <li key={line} className="flex items-start gap-3 text-[15px] leading-snug text-[var(--color-paper-100)]">
                  <Check size={18} className="mt-0.5 shrink-0 text-[var(--color-gold-400)]" aria-hidden />
                  {line}
                </li>
              ))}
            </ul>

            <div className="flex flex-col gap-4 md:items-end">
              <form action={startBaseCheckout} className="w-full md:w-auto md:flex md:flex-col md:items-end">
                {/* Dárkový poukaz — only in the gift flow. The configurator's
                    hidden fields (voucher_*) submit with this form; the live A5
                    preview sits on a light card so it reads on the navy panel.
                    startBaseCheckout reads these fields, mints the voucher, and
                    threads its token into the payment. */}
                {isGift ? (
                  <div className="editorial mb-5 w-full rounded-[14px] bg-[var(--color-paper-100)] p-5 text-[var(--color-ink-900)] md:max-w-[26rem]">
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
                      Dárkový poukaz k vytištění
                    </p>
                    <p className="mb-4 text-[13px] leading-snug text-[var(--color-text-muted)]">
                      Po zaplacení si poukaz stáhnete jako PDF a předáte — i&nbsp;než stihnete
                      Vzpomínkář nastavit.
                    </p>
                    <VoucherConfigurator fieldPrefix="voucher" />
                  </div>
                ) : null}
                {/* Order bump — a second printed copy added to this purchase.
                    Rendered only when the env price is set (extraCopyCzk > 0),
                    so we never show a "0 Kč" upsell. Price shown = charged. */}
                {showExtraCopyBump ? (
                  <label className="mb-4 flex w-full cursor-pointer items-start gap-3 rounded-[12px] border border-[var(--color-gold-400)]/35 bg-white/[0.06] px-4 py-3 md:max-w-[20rem]">
                    <input
                      type="checkbox"
                      name="extra_copy"
                      value="1"
                      className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-gold-400)]"
                    />
                    <span className="text-[13px] leading-snug text-[var(--color-paper-100)]">
                      Přidat druhý výtisk — třeba pro sourozence
                      <span className="mt-0.5 block text-[var(--color-gold-300)]">
                        {extraCopyCzk.toLocaleString("cs-CZ")}&nbsp;Kč za druhý výtisk
                      </span>
                    </span>
                  </label>
                ) : null}
                {/* Coupon entry — only on a real charged setup (priceCzk > 0).
                    On the free path the book is already free, so a discount
                    field would be meaningless. Prefilled + opened automatically
                    when a code arrives via ?coupon= (e.g. an autoresponder
                    link). The field name "coupon" is read by startBaseCheckout
                    and re-validated server-side. */}
                {priceCzk > 0 ? (
                  <CouponField
                    defaultValue={prefillCoupon}
                    applied={hasAppliedDiscount}
                  />
                ) : null}
                <button
                  type="submit"
                  className={cn(buttonVariants({ variant: "primary", size: "lg" }), "w-full md:w-auto")}
                >
                  {priceCzk > 0
                    ? hasAppliedDiscount
                      ? `Zaplatit ${chargedAfterCouponCzk.toLocaleString("cs-CZ")} Kč a začít sbírat`
                      : "Zaplatit a začít sbírat"
                    : "Začít sbírat vzpomínky"}
                  <span
                    aria-hidden
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--card-navy)] text-[13px] font-semibold text-[var(--color-on-accent)]"
                  >
                    ↗
                  </span>
                </button>
              </form>

              {/* Reassurance stack — true claims only (no money-back guarantee
                  by design). Sits directly under the CTA, where the money is
                  committed. */}
              <ul className="flex flex-col gap-2 md:items-end" aria-label="Co máte jisté">
                {[
                  "Píše a pomáhá vám člověk",
                  "Přístup ke knize máte napořád",
                  "Zabezpečená platba přes Stripe",
                ].map((line) => (
                  <li
                    key={line}
                    className="flex items-start gap-2 text-[13px] leading-snug text-[var(--color-paper-200)] md:flex-row-reverse md:text-right"
                  >
                    <Check size={15} className="mt-0.5 shrink-0 text-[var(--color-gold-400)]" aria-hidden />
                    {line}
                  </li>
                ))}
              </ul>

              {priceCzk > 0 ? (
                <p className="text-xs text-[var(--color-paper-300)] md:text-right">
                  Bez předplatného · přístup napořád
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Honest expectation-setter instead of unverified social proof — what
          actually happens once the payment goes through. */}
      <div className="space-y-4">
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-normal text-[var(--color-ink-900)]">
          Co se stane po zaplacení
        </h2>
        <ol className="space-y-3">
          {[
            "Vyberete první otázku — vašemu blízkému dorazí e-mailem (zatím každé pondělí).",
            "On odpoví vlastními slovy nebo hlasem, my zařídíme přepis i korekturu.",
            "Až bude kniha hotová, objednáte první výtisk — tisk je v ceně.",
          ].map((line, i) => (
            <li key={line} className="flex items-start gap-3 text-[15px] leading-relaxed text-[var(--color-text-muted)]">
              <span
                aria-hidden
                className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-navy-50)] font-[family-name:var(--font-display)] text-[13px] text-[var(--color-navy-800)]"
              >
                {i + 1}
              </span>
              {line}
            </li>
          ))}
        </ol>
      </div>

      {/* Quiet consent line — the onboarding chrome has no SiteFooter, so this
          is the only reachable Podmínky/Soukromí link on the pay screen. */}
      <p className="text-xs leading-relaxed text-[var(--color-text-muted)]">
        Kliknutím na tlačítko souhlasíte s{" "}
        <a
          href="/podminky"
          className="underline decoration-[var(--color-navy-200)] underline-offset-2 transition-colors hover:text-[var(--color-ink-900)]"
        >
          obchodními podmínkami
        </a>{" "}
        a{" "}
        <a
          href="/soukromi"
          className="underline decoration-[var(--color-navy-200)] underline-offset-2 transition-colors hover:text-[var(--color-ink-900)]"
        >
          zpracováním osobních údajů
        </a>
        .
      </p>
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
          background: "linear-gradient(160deg, #24395c 0%, #1B2E4D 55%, #14243d 100%)",
          borderRadius: "3px 8px 8px 3px",
          boxShadow:
            "-3px 0 10px -3px rgba(0,0,0,.4), 0 24px 44px -18px rgba(20,15,10,.7), inset 0 0 0 1px rgba(0,0,0,.3)",
        }}
      >
        {/* gold inner frame */}
        <span
          className="pointer-events-none absolute inset-[9px] rounded-[2px]"
          style={{ border: "1.5px solid rgba(254,247,215,0.55)" }}
          aria-hidden
        />
        {/* spine shadow */}
        <span
          className="pointer-events-none absolute inset-y-0 left-0 w-[8px]"
          style={{ background: "linear-gradient(90deg, rgba(0,0,0,.32), transparent)", borderRadius: "3px 0 0 3px" }}
          aria-hidden
        />
        <span className="text-[8px] font-medium uppercase tracking-[0.4em] text-[rgba(254,247,215,0.8)]">
          Kniha vzpomínek
        </span>
        <span
          className="font-[family-name:var(--font-display)] text-[26px] leading-none text-[#FEF7D7]"
          style={{ textShadow: "0 1px 0 rgba(0,0,0,.45)" }}
        >
          Vzpomínkář
        </span>
        {seniorName ? (
          <span className="max-w-full truncate text-[11px] text-[rgba(254,247,215,0.85)]">{seniorName}</span>
        ) : null}
        <span className="mt-0.5 text-[9px] uppercase tracking-[0.38em] text-[rgba(254,247,215,0.7)]">
          Díl 1 · 2026
        </span>
      </div>
    </div>
  );
}
