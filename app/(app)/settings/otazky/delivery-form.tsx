"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { updateDeliverySettings } from "@/lib/auth/senior-actions";
import { channelNeedsAttestation, attestationText } from "@/lib/validations/auth";

// Normalize a typed phone to E.164 (matches phoneE164Schema's ^\+[1-9]\d{1,14}$).
// Strips spaces/dashes/parens; a leading 00 becomes +; a bare CZ-style 9-digit
// number is assumed +420. Returns null when it can't produce a valid E.164.
function normalizePhoneE164(raw: string): string | null {
  let v = raw.trim().replace(/[\s().\-/]/g, "");
  if (!v) return null;
  if (v.startsWith("00")) v = "+" + v.slice(2);
  if (!v.startsWith("+") && /^\d{9}$/.test(v)) v = "+420" + v; // bare CZ number
  return /^\+[1-9]\d{1,14}$/.test(v) ? v : null;
}

interface DeliveryFormProps {
  familyId: string;
  senior: {
    id: string;
    display_name: string | null;
    senior_role: string | null;
    contact_channel: string | null;
    contact_address: string | null;
    phone_e164: string | null;
    prompt_frequency: number;
  };
}

export function DeliveryForm({ familyId, senior }: DeliveryFormProps) {
  const [channel, setChannel] = useState(senior.contact_channel ?? "");
  // For e-mail this holds the e-mail address; sms/whatsapp use `phone` below.
  const [address, setAddress] = useState(senior.contact_address ?? "");
  const [phone, setPhone] = useState(senior.phone_e164 ?? "");
  const [attestation, setAttestation] = useState(false);
  const [frequency, setFrequency] = useState(senior.prompt_frequency ?? 1);
  const [pending, start] = useTransition();
  const router = useRouter();

  const seniorName = senior.display_name ?? "tento blízký";
  const needsAttestation = channelNeedsAttestation(channel);
  const attestationLabel =
    channel === "sms" || channel === "whatsapp" ? attestationText(seniorName, channel) : "";

  function handleSave() {
    // E-mail keeps using contact_address; sms/whatsapp send a normalized phone
    // + the freshly-made owner attestation (the server re-validates and stamps
    // {sms|whatsapp}_attested_at). We don't reuse a stored attestation — the
    // owner re-attests on every save of an SMS/WhatsApp channel. The exact text
    // shown is passed through verbatim so the server stores what the owner saw.
    if (channel === "sms" || channel === "whatsapp") {
      const e164 = normalizePhoneE164(phone);
      if (!e164) {
        toast.error("Zadejte telefonní číslo v mezinárodním formátu, např. +420777123456.");
        return;
      }
      if (!attestation) {
        toast.error("Bez potvrzení nelze otázky posílat přes SMS ani WhatsApp.");
        return;
      }
      start(async () => {
        const result = await updateDeliverySettings(familyId, senior.id, {
          contactChannel: channel,
          contactAddress: null,
          phoneE164: e164,
          channelAttestation: true,
          channelAttestationText: attestationText(seniorName, channel),
          promptFrequency: frequency as 1 | 2,
        });
        if (result.ok) {
          toast.success("Uloženo");
          router.refresh();
        } else {
          toast.error(result.error ?? "Uložení se nepodařilo.");
        }
      });
      return;
    }

    start(async () => {
      const result = await updateDeliverySettings(familyId, senior.id, {
        contactChannel: channel || null,
        contactAddress: address.trim() || null,
        phoneE164: null,
        channelAttestation: false,
        channelAttestationText: null,
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
            onChange={(e) => {
              setChannel(e.target.value);
              setAttestation(false); // re-attest whenever the channel changes
            }}
          >
            <option value="">- nevybráno -</option>
            <option value="email">E-mail</option>
            <option value="sms">SMS</option>
            <option value="whatsapp">WhatsApp</option>
          </Select>
        </div>

        {needsAttestation ? (
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor={`phone-${senior.id}`}>
              Telefon ({channel === "sms" ? "SMS" : "WhatsApp"})
            </Label>
            <Input
              id={`phone-${senior.id}`}
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              maxLength={32}
              placeholder="+420 777 123 456"
            />
          </div>
        ) : (
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor={`addr-${senior.id}`}>E-mailová adresa</Label>
            <Input
              id={`addr-${senior.id}`}
              type="email"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              maxLength={200}
              placeholder="jana@email.cz"
            />
          </div>
        )}
      </div>

      {needsAttestation ? (
        // GDPR Art. 6(1)(f): the owner makes a truthful attestation (NOT "the
        // senior consents"). Stored verbatim with the {sms|whatsapp}_attested_at
        // timestamp on save.
        <label className="flex cursor-pointer items-start gap-2.5 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] p-3">
          <input
            type="checkbox"
            checked={attestation}
            onChange={(e) => setAttestation(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-navy-700)]"
          />
          <span className="text-sm leading-relaxed text-[var(--color-text)]">{attestationLabel}</span>
        </label>
      ) : null}

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
