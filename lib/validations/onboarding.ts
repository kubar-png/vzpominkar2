import { z } from "zod";

export const onboardingStartSchema = z
  .object({
    // Optional now — onboarding only asks for the storyteller's name; the
    // family/project name is derived from it (the owner can rename later).
    familyName: z
      .string()
      .max(80, "Název je dlouhý.")
      .optional()
      .nullable(),
    seniorDisplayName: z
      .string()
      .min(2, "Zadejte jméno blízkého.")
      .max(80, "Jméno je dlouhé."),
  })
  .strict();

export type OnboardingStartInput = z.infer<typeof onboardingStartSchema>;
