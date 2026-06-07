"use client";

import { useActionState, useState } from "react";
import { Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { placeExtraCopiesOrder } from "@/lib/book/actions";

/**
 * Extra-copies upsell on the Kniha page. Collapsed by default to a single CTA so
 * it reads as an offer, not a form. Opening it reveals a quantity selector
 * (1–5 additional copies) + the same shipping fields as the first order. The
 * total updates live; the price shown equals what the server charges
 * (unitCzk × copies). The server recomputes the price independently.
 */
export function ExtraCopiesForm({
  familyId,
  unitCzk,
}: {
  familyId: string;
  unitCzk: number;
}) {
  const [open, setOpen] = useState(false);
  const [copies, setCopies] = useState(1);
  const [state, formAction, pending] = useActionState<
    { ok: false; error: string } | null,
    FormData
  >(placeExtraCopiesOrder, null);

  const total = unitCzk * copies;

  if (!open) {
    return (
      <Button
        type="button"
        variant="secondary"
        size="lg"
        onClick={() => setOpen(true)}
      >
        <Gift size={16} aria-hidden />
        Objednat další výtisk (od {unitCzk.toLocaleString("cs-CZ")} Kč)
      </Button>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="familyId" value={familyId} />

      <div className="space-y-1.5">
        <Label htmlFor="copies">Počet dalších výtisků</Label>
        <div className="flex flex-wrap items-center gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setCopies(n)}
              aria-pressed={copies === n}
              className={
                copies === n
                  ? "h-10 w-10 rounded-[var(--radius-md)] border border-[var(--color-navy-700)] bg-[var(--color-navy-700)] text-sm font-semibold text-white"
                  : "h-10 w-10 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white text-sm font-medium text-[var(--color-navy-900)] transition-colors hover:border-[var(--color-navy-300)]"
              }
            >
              {n}
            </button>
          ))}
        </div>
        <input type="hidden" name="copies" value={copies} />
        <p className="text-sm text-[var(--color-text-muted)]">
          Celkem{" "}
          <span className="font-semibold text-[var(--color-navy-900)] tabular-nums">
            {total.toLocaleString("cs-CZ")} Kč
          </span>{" "}
          za {copies}{" "}
          {copies === 1 ? "výtisk" : copies < 5 ? "výtisky" : "výtisků"} ·{" "}
          {unitCzk.toLocaleString("cs-CZ")} Kč za kus
        </p>
      </div>

      <Field label="Jméno a příjmení" name="fullName" autoComplete="name" required />
      <Field label="Ulice a č. p." name="street" autoComplete="address-line1" required />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Město" name="city" autoComplete="address-level2" required />
        <Field label="PSČ" name="zip" autoComplete="postal-code" required />
      </div>
      <Field
        label="Země"
        name="country"
        defaultValue="Česká republika"
        autoComplete="country-name"
        required
      />
      <Field label="Telefon (volitelně)" name="phone" type="tel" autoComplete="tel" />

      {state?.ok === false ? (
        <p
          role="alert"
          className="rounded-[var(--radius-md)] border border-[var(--color-red-200)] bg-[var(--color-red-50)] p-3 text-sm text-[var(--color-red-700)]"
        >
          {state.error}
        </p>
      ) : null}

      <div className="flex flex-wrap justify-end gap-3">
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Zrušit
        </Button>
        <Button type="submit" size="lg" disabled={pending}>
          {pending
            ? "Vyřizujeme…"
            : `Objednat za ${total.toLocaleString("cs-CZ")} Kč`}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={props.name}>{label}</Label>
      <Input id={props.name} {...props} />
    </div>
  );
}
