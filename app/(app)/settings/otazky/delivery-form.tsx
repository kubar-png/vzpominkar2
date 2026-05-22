"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
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
  const [pending, start] = useTransition();
  const router = useRouter();

  function handleSave() {
    start(async () => {
      const result = await updateDeliverySettings(familyId, senior.id, {
        contactChannel: channel || null,
        contactAddress: address.trim() || null,
        promptFrequency: frequency as 1 | 2,
      });
      if (result.ok) {
        toast.success("Uloženo");
        router.refresh();
      } else {
        toast.error(result.error ?? "Uložení se nepodařilo.");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor={`ch-${senior.id}`}>Způsob doručení</Label>
          <Select
            id={`ch-${senior.id}`}
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
          >
            <option value="">- nevybráno -</option>
            <option value="email">E-mail</option>
            <option value="whatsapp">WhatsApp</option>
          </Select>
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor={`addr-${senior.id}`}>
            {channel === "whatsapp" ? "Telefon (WhatsApp)" : "E-mailová adresa"}
          </Label>
          <Input
            id={`addr-${senior.id}`}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            maxLength={200}
            placeholder={channel === "whatsapp" ? "+420 777 123 456" : "jana@email.cz"}
          />
        </div>
      </div>

      <div className="flex items-end justify-between gap-4">
        <div className="space-y-1.5">
          <Label htmlFor={`freq-${senior.id}`}>Frekvence odesílání</Label>
          <Select
            id={`freq-${senior.id}`}
            value={frequency}
            onChange={(e) => setFrequency(Number(e.target.value) as 1 | 2)}
            className="w-auto min-w-[180px]"
          >
            <option value={1}>Jednou týdně (pondělí)</option>
            <option value={2}>Dvakrát týdně (po + čt)</option>
          </Select>
        </div>

        <Button size="sm" onClick={handleSave} disabled={pending}>
          {pending ? "Ukládám…" : "Uložit"}
        </Button>
      </div>
    </div>
  );
}
