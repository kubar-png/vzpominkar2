"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";

/**
 * Coupon entry on the main-product paywall.
 *
 * Two jobs, kept honest:
 *  1. APPLY — typing a code and pressing "Uplatnit" navigates the page to
 *     `?coupon=CODE`, so the SERVER re-renders, re-validates the code, and shows
 *     the real discounted total. The buyer always sees the exact charged price
 *     before committing — we never show a discount the server hasn't blessed.
 *  2. SUBMIT — a hidden `coupon` input carries the (already server-validated)
 *     code into the parent <form action={startBaseCheckout}>, which re-validates
 *     it AGAIN server-side. The client value is never trusted as a discount.
 *
 * Opens automatically when a code is present (URL-prefilled or applied), so an
 * autoresponder link lands the buyer on a clearly-discounted screen.
 */
export function CouponField({
  defaultValue,
  applied,
}: {
  defaultValue: string;
  applied: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  // A code in the URL (whether it validated or not) means the buyer is already
  // interacting with the coupon flow → keep the field open.
  const [open, setOpen] = useState(applied || Boolean(defaultValue));
  const [code, setCode] = useState(defaultValue);

  // The code present in the URL but NOT applied → it was rejected server-side.
  const rejected = Boolean(defaultValue) && !applied;

  function apply() {
    const trimmed = code.trim().toUpperCase();
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    if (trimmed) params.set("coupon", trimmed);
    else params.delete("coupon");
    // Re-render the server page with the new ?coupon= so the discount is
    // validated and the total updated. scroll:false keeps the buyer in place.
    const qs = params.toString();
    router.replace(qs ? `?${qs}` : "?", { scroll: false });
  }

  return (
    <div className="mb-4 w-full md:max-w-[20rem]">
      {/* Hidden carrier so the applied code submits with the checkout form. */}
      <input type="hidden" name="coupon" value={applied ? defaultValue : ""} />

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-[13px] text-[var(--color-gold-300)] underline decoration-[var(--color-gold-400)]/40 underline-offset-2 transition-colors hover:text-[var(--color-gold-400)]"
        >
          Mám slevový kód
        </button>
      ) : (
        <div className="rounded-[12px] border border-[var(--color-gold-400)]/35 bg-white/[0.06] px-4 py-3">
          <label
            htmlFor="coupon-code"
            className="block text-[13px] text-[var(--color-paper-100)]"
          >
            Slevový kód
          </label>
          <div className="mt-2 flex gap-2">
            <Input
              id="coupon-code"
              inputSize="sm"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  apply();
                }
              }}
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
              placeholder="např. VITEJTE200"
              className="border-white/25 bg-white/10 uppercase text-[var(--color-paper-100)] placeholder:text-[var(--color-paper-300)]/60"
            />
            <button
              type="button"
              onClick={apply}
              className="shrink-0 rounded-[var(--radius-md)] border border-[var(--color-gold-400)]/60 px-3 text-[13px] font-medium text-[var(--color-gold-300)] transition-colors hover:bg-white/10"
            >
              Uplatnit
            </button>
          </div>
          {applied ? (
            <p className="mt-2 text-[12px] text-[var(--color-gold-300)]">
              Sleva byla uplatněna — nová cena je výše.
            </p>
          ) : null}
          {rejected ? (
            <p className="mt-2 text-[12px] text-[var(--color-paper-300)]">
              Tento kód neplatí — zkontrolujte ho prosím.
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
