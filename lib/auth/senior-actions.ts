"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireOwnerOfFamily } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { SENIOR_ROLE_OPTIONS, phoneE164Schema, channelNeedsAttestation } from "@/lib/validations/auth";

const ROLE_VALUES: string[] = SENIOR_ROLE_OPTIONS.map((r) => r.value);

// corr-02: the profile editor (senior-card) must NOT be able to re-enable
// sms/whatsapp on a stale attestation. It is restricted to email-only; all
// sms/whatsapp setup goes through updateDeliverySettings below, which captures
// a fresh owner attestation and stamps {sms|whatsapp}_attested_at.
const updateSchema = z.object({
  displayName: z.string().min(1, "Zadejte jméno.").max(80),
  seniorRole: z.string().refine((v) => !v || ROLE_VALUES.includes(v), "Neplatná role.").optional().nullable(),
  gender: z.enum(["male", "female"]).optional().nullable(),
  contactChannel: z.enum(["email"]).optional().nullable(),
  contactAddress: z.string().max(200).optional().nullable(),
  promptFrequency: z.union([z.literal(1), z.literal(2)]).default(1),
  isSenior: z.boolean().optional(),
});

const deliverySchema = z.object({
  contactChannel: z.enum(["email", "sms", "whatsapp"]).optional().nullable(),
  contactAddress: z.string().max(200).optional().nullable(),
  // E.164 phone for sms/whatsapp routing (profiles.phone_e164).
  phoneE164: phoneE164Schema,
  // GDPR Art. 6(1)(f): the owner makes a truthful attestation for SMS/WhatsApp
  // (NOT consent on the senior's behalf). `channelAttestationText` is the exact
  // wording shown, stored verbatim in profiles.channel_attestation_text.
  channelAttestation: z.boolean().optional(),
  channelAttestationText: z.string().max(2000).optional().nullable(),
  promptFrequency: z.union([z.literal(1), z.literal(2)]).default(1),
});

export type SeniorActionResult = { ok: true } | { ok: false; error: string };

export async function updateSeniorProfile(
  familyId: string,
  seniorId: string,
  formData: {
    displayName: string;
    seniorRole: string | null;
    gender?: "male" | "female" | null;
    contactChannel?: string | null;
    contactAddress?: string | null;
    promptFrequency?: number;
    isSenior?: boolean;
  },
): Promise<SeniorActionResult> {
  await requireOwnerOfFamily(familyId);

  const parsed = updateSchema.safeParse(formData);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Neplatné údaje." };
  }

  const admin = createAdminClient();

  const update: {
    display_name: string;
    senior_role: string | null;
    gender: "male" | "female" | null;
    contact_channel?: "email" | null;
    contact_address?: string | null;
    prompt_frequency: number;
    is_senior?: boolean;
  } = {
    display_name: parsed.data.displayName,
    senior_role: parsed.data.seniorRole ?? null,
    gender: parsed.data.gender ?? null,
    prompt_frequency: parsed.data.promptFrequency,
  };
  // corr-02: only touch the delivery channel/address when the caller actually
  // sent them (email-only here). For an SMS/WhatsApp senior the editor omits
  // these keys, so this profile edit can neither wipe nor re-enable a phone
  // channel — that lives in the attestation-aware delivery form.
  if ("contactChannel" in formData) {
    update.contact_channel = parsed.data.contactChannel ?? null;
  }
  if ("contactAddress" in formData) {
    update.contact_address = parsed.data.contactAddress?.trim() || null;
  }
  if (typeof parsed.data.isSenior === "boolean") {
    update.is_senior = parsed.data.isSenior;
  }

  const { error } = await admin
    .from("profiles")
    .update(update)
    .eq("id", seniorId)
    .eq("family_id", familyId)
    .eq("role", "senior");

  if (error) return { ok: false, error: "Uložení se nepodařilo." };

  revalidatePath(`/family/${familyId}/rodina`);
  return { ok: true };
}

export async function updateDeliverySettings(
  familyId: string,
  seniorId: string,
  formData: {
    contactChannel?: string | null;
    contactAddress?: string | null;
    phoneE164?: string | null;
    channelAttestation?: boolean;
    channelAttestationText?: string | null;
    promptFrequency?: number;
  },
): Promise<SeniorActionResult> {
  await requireOwnerOfFamily(familyId);

  const parsed = deliverySchema.safeParse(formData);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Neplatné údaje." };
  }

  // SMS/WhatsApp require a phone + the owner attestation (the client blocks this
  // too, but never trust the client). Lawful basis = GDPR Art. 6(1)(f); the
  // owner makes a truthful attestation, NOT consent on the senior's behalf.
  // Mirrors §7.
  const attestationChannel = channelNeedsAttestation(parsed.data.contactChannel)
    ? parsed.data.contactChannel
    : null;
  if (attestationChannel) {
    if (!parsed.data.phoneE164) {
      return { ok: false, error: "Pro SMS i WhatsApp je potřeba platné telefonní číslo." };
    }
    if (!parsed.data.channelAttestation || !parsed.data.channelAttestationText) {
      return {
        ok: false,
        error: "Bez potvrzení nelze otázky posílat přes SMS ani WhatsApp.",
      };
    }
  }

  const admin = createAdminClient();

  // Persist phone + attestation atomically with the channel. When the chosen
  // channel is sms/whatsapp, stamp the matching {sms|whatsapp}_attested_at = now()
  // and store the verbatim attestation text. When it's NOT that channel, clear
  // the phone/attestation and null the matching attested-at so no stale
  // attestation lingers. corr-03: a fresh attestation also clears that channel's
  // *_opt_out_at so the (re-)attested number isn't masked by a prior opt-out.
  const now = new Date().toISOString();
  const { error } = await admin
    .from("profiles")
    .update({
      contact_channel: parsed.data.contactChannel ?? null,
      contact_address: attestationChannel ? null : parsed.data.contactAddress?.trim() || null,
      phone_e164: attestationChannel ? parsed.data.phoneE164 : null,
      channel_attestation_text: attestationChannel ? parsed.data.channelAttestationText : null,
      sms_attested_at: attestationChannel === "sms" ? now : null,
      whatsapp_attested_at: attestationChannel === "whatsapp" ? now : null,
      ...(attestationChannel === "sms" ? { sms_opt_out_at: null } : {}),
      ...(attestationChannel === "whatsapp" ? { whatsapp_opt_out_at: null } : {}),
      prompt_frequency: parsed.data.promptFrequency,
    })
    .eq("id", seniorId)
    .eq("family_id", familyId)
    .eq("role", "senior");

  if (error) return { ok: false, error: "Uložení se nepodařilo." };

  revalidatePath("/settings/otazky");
  revalidatePath(`/family/${familyId}/rodina`);
  return { ok: true };
}

export async function deleteSeniorAccount(
  familyId: string,
  seniorId: string,
): Promise<SeniorActionResult> {
  await requireOwnerOfFamily(familyId);

  const admin = createAdminClient();

  // Verify the senior actually belongs to this family before deleting.
  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq("id", seniorId)
    .eq("family_id", familyId)
    .eq("role", "senior")
    .maybeSingle<{ id: string }>();

  if (!profile) return { ok: false, error: "Senior nebyl nalezen." };

  // Deleting the auth user cascades to the profiles row.
  const { error } = await admin.auth.admin.deleteUser(seniorId);
  if (error) return { ok: false, error: "Smazání se nepodařilo." };

  revalidatePath(`/family/${familyId}/rodina`);
  return { ok: true };
}
