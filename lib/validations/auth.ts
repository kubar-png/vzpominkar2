import { z } from "zod";

/**
 * E.164 phone number (e.g. +420777123456). Used for SMS/WhatsApp routing
 * (profiles.phone_e164). `+` then a 1-9 leading digit then up to 14 more.
 * Optional + nullable so forms that don't collect a phone still validate.
 */
export const phoneE164Schema = z
  .string()
  .regex(/^\+[1-9]\d{1,14}$/, "Zadejte telefonní číslo v mezinárodním formátu, např. +420777123456.")
  .optional()
  .nullable();

export const ownerSignupSchema = z
  .object({
    email: z.string().email("Zadejte platný e-mail."),
    password: z
      .string()
      .min(10, "Heslo musí mít aspoň 10 znaků.")
      .max(128, "Heslo je příliš dlouhé."),
    displayName: z
      .string()
      .min(2, "Vaše jméno je krátké.")
      .max(80, "Vaše jméno je příliš dlouhé."),
  })
  .strict();

export const ownerLoginSchema = z
  .object({
    email: z.string().email("Zadejte platný e-mail."),
    password: z.string().min(1, "Vyplňte heslo."),
  })
  .strict();

export const seniorLoginSchema = z
  .object({
    username: z
      .string()
      .min(3, "Uživatelské jméno je krátké.")
      .max(32, "Uživatelské jméno je dlouhé.")
      .regex(/^[a-z][a-z0-9_.-]{2,31}$/, "Uživatelské jméno smí obsahovat jen malá písmena, číslice a . _ -"),
    password: z.string().min(1, "Vyplňte heslo."),
  })
  .strict();

export const SENIOR_ROLE_OPTIONS = [
  { value: "babicka", label: "Babička" },
  { value: "dedecek", label: "Dědeček" },
  { value: "mama", label: "Máma" },
  { value: "tata", label: "Táta" },
  { value: "prababicka", label: "Prababička" },
  { value: "pradedecek", label: "Pradědeček" },
  { value: "teta", label: "Teta" },
  { value: "stryc", label: "Strýc" },
  { value: "jine", label: "Jiné" },
] as const;

export type SeniorRoleValue = (typeof SENIOR_ROLE_OPTIONS)[number]["value"];

// Grammatical gender of the senior, for Czech tykání in the questions they're
// asked (see lib/gender.ts). Defaulted from the role, but editable.
export const GENDER_OPTIONS = [
  { value: "female", label: "Žena" },
  { value: "male", label: "Muž" },
] as const;

export const seniorAccountSchema = z
  .object({
    displayName: z.string().min(1, "Zadejte jméno seniora.").max(80),
    username: z
      .string()
      .min(3, "Uživatelské jméno musí mít aspoň 3 znaky.")
      .max(32)
      .regex(/^[a-z][a-z0-9_.-]{2,31}$/, "Jen malá písmena, číslice a . _ -"),
    password: z
      .string()
      .min(8, "Heslo seniora musí mít aspoň 8 znaků.")
      .max(128),
    seniorRole: z.string().max(40).optional().nullable(),
    gender: z.enum(["male", "female"]).optional().nullable(),
    // Year of birth only (no full date) — for usage analytics by age cohort.
    // Optional at the schema level (the onboarding senior-setup step doesn't
    // ask for it); the add-senior form makes it required client-side.
    birthYear: z.coerce
      .number({ invalid_type_error: "Zadejte rok narození." })
      .int("Zadejte rok narození.")
      .min(1900, "Rok narození není platný.")
      .max(new Date().getFullYear(), "Rok narození není platný.")
      .optional()
      .nullable(),
    contactChannel: z.enum(["email", "sms", "whatsapp"]).optional().nullable(),
    contactAddress: z.string().max(200).optional().nullable(),
    // E.164 phone for sms/whatsapp routing (profiles.phone_e164).
    phoneE164: phoneE164Schema,
    // GDPR Art. 6(1)(f) legitimate interest (NOT consent): the weekly question
    // is a service message, so the owner makes an ATTESTATION (Art. 5(2)
    // accountability evidence) — that they know the senior, have agreement to
    // use the number, and have informed the senior. `channelAttestation` is the
    // checkbox; `channelAttestationText` is the exact wording shown, stored
    // verbatim in profiles.channel_attestation_text.
    channelAttestation: z.boolean().optional(),
    channelAttestationText: z.string().max(2000).optional().nullable(),
    promptFrequency: z.union([z.literal(1), z.literal(2)]).default(1),
  })
  .strict()
  // Symmetric to the client guard in add-senior-panel: the e-mail channel needs
  // an address, otherwise the weekly question silently has nowhere to go. (The
  // phone is guarded via phoneE164Schema + the client normalizer.)
  .superRefine((data, ctx) => {
    if (data.contactChannel === "email" && !data.contactAddress?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["contactAddress"],
        message: "E-mail vyžaduje adresu.",
      });
    }
  });

/**
 * Channels that require an owner ATTESTATION before the platform may message
 * the senior. Lawful basis for sending is GDPR Art. 6(1)(f) legitimate interest
 * (the weekly question is a service message, NOT marketing) — so this is NOT
 * consent. The owner cannot consent on the senior's behalf; instead the owner
 * makes a truthful attestation (Art. 5(2) accountability evidence): that they
 * know the senior personally, have agreement to use the number, and have
 * informed the senior we will send weekly questions there + how to opt out.
 * Email needs no attestation.
 * See docs/superpowers/specs/2026-06-05-multichannel-question-delivery-design.md §7
 * and docs/legal/2026-06-06-LIA-sms-whatsapp.md.
 */
export const ATTESTATION_CHANNELS = ["sms", "whatsapp"] as const;

export type AttestationChannel = (typeof ATTESTATION_CHANNELS)[number];

export function channelNeedsAttestation(
  channel: string | null | undefined,
): channel is AttestationChannel {
  return channel === "sms" || channel === "whatsapp";
}

/**
 * The exact ATTESTATION wording shown to the owner and stored verbatim in
 * profiles.channel_attestation_text alongside the {sms|whatsapp}_attested_at
 * timestamp. This is an attestation the owner can TRUTHFULLY make — it is NOT
 * "the senior consents". The senior's display name is substituted for {jméno};
 * platform voice (vykání) toward the buyer.
 *
 * Keep this the single source of truth — both forms render it and both server
 * actions persist exactly what was shown.
 */
export function attestationText(seniorName: string, _channel: AttestationChannel): string {
  const name = seniorName.trim() || "tento blízký";
  return `Potvrzuji, že ${name} znám osobně, mám souhlas k uvedení jeho/jejího telefonního čísla a že ${name} informuji, že mu/jí budeme na toto číslo posílat týdenní otázky. ${name} se může kdykoliv odhlásit.`;
}

export type OwnerSignupInput = z.infer<typeof ownerSignupSchema>;
export type OwnerLoginInput = z.infer<typeof ownerLoginSchema>;
export type SeniorLoginInput = z.infer<typeof seniorLoginSchema>;
export type SeniorAccountInput = z.input<typeof seniorAccountSchema>;
