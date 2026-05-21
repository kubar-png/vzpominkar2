"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { updateDeliverySettings } from "@/lib/auth/senior-actions";

interface DeliveryFormProps {
  familyId: string;
  senior: {
    id: string;
    display_name: string | null;
    senior_role: string | null;
    contact_channel: string | null;
    contact_address: string | null;
    prompt_frequency: number;
  };
}

export function DeliveryForm({ familyId, senior }: DeliveryFormProps) {
  const [channel, setChannel] = useState(senior.contact_channel ?? "");
  const [address, setAddress] = useState(senior.contact_address ?? "");
  const [frequency, setFrequency] = useState(senior.prompt_frequency ?? 1);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  function handleSave() {
    setError(null);
    setSaved(false);
    start(async () => {
      const result = await updateDeliverySettings(familyId, senior.id, {
        contactChannel: channel || null,
        contactAddress: address.trim() || null,
        promptFrequency: frequency as 1 | 2,
      });
      if (result.ok) {
        setSaved(true);
        router.refresh();
      } else {
        setError(result.error ?? "Uložení se nepodařilo.");
      }
    });
  }

  const selectClass =
    "w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]";

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor={`ch-${senior.id}`}>Způsob doručení</Label>
          <select
            id={`ch-${senior.id}`}
            value={channel}
            onChange={(e) => { setChannel(e.target.value); setSaved(false); }}
            className={selectClass}
          >
            <option value="">- nevybráno -</option>
            <option value="email">E-mail</option>
            <option value="whatsapp">WhatsApp</option>
          </select>
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor={`addr-${senior.id}`}>
            {channel === "whatsapp" ? "Telefon (WhatsApp)" : "E-mailová adresa"}
          </Label>
          <Input
            id={`addr-${senior.id}`}
            value={address}
            onChange={(e) => { setAddress(e.target.value); setSaved(false); }}
            maxLength={200}
            placeholder={channel === "whatsapp" ? "+420 777 123 456" : "jana@email.cz"}
          />
        </div>
      </div>

      <div className="flex items-end justify-between gap-4">
        <div className="space-y-1.5">
          <Label htmlFor={`freq-${senior.id}`}>Frekvence odesílání</Label>
          <select
            id={`freq-${senior.id}`}
            value={frequency}
            onChange={(e) => { setFrequency(Number(e.target.value) as 1 | 2); setSaved(false); }}
            className={selectClass + " w-auto min-w-[180px]"}
          >
            <option value={1}>Jednou týdně (pondělí)</option>
            <option value={2}>Dvakrát týdně (po + čt)</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-[var(--color-text-muted)]">
              <Check size={14} className="text-green-600" /> Uloženo
            </span>
          )}
          {error && (
            <span className="text-sm text-[var(--color-danger)]">{error}</span>
          )}
          <Button size="sm" onClick={handleSave} disabled={pending}>
            {pending ? "Ukládám…" : "Uložit"}
          </Button>
        </div>
      </div>
    </div>
  );
}
