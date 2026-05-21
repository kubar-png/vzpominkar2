"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { placeBookOrder } from "@/lib/book/actions";

export function BookOrderForm({ familyId }: { familyId: string }) {
  const [state, formAction, pending] = useActionState<
    { ok: false; error: string } | null,
    FormData
  >(placeBookOrder, null);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="familyId" value={familyId} />

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

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Vyřizujeme…" : "Objednat knihu"}
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
