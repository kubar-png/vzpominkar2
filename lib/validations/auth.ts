import { z } from "zod";

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
    contactChannel: z.enum(["email", "whatsapp"]).optional().nullable(),
    contactAddress: z.string().max(200).optional().nullable(),
    promptFrequency: z.union([z.literal(1), z.literal(2)]).default(1),
  })
  .strict();

export type OwnerSignupInput = z.infer<typeof ownerSignupSchema>;
export type OwnerLoginInput = z.infer<typeof ownerLoginSchema>;
export type SeniorLoginInput = z.infer<typeof seniorLoginSchema>;
export type SeniorAccountInput = z.input<typeof seniorAccountSchema>;
