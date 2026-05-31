import { z } from "zod";

export const onboardingStartSchema = z
  .object({
    familyName: z
      .string()
      .min(2, "Pojmenujte svou rodinu (např. „Vzpomínky babičky Marie“).")
      .max(80, "Název je dlouhý."),
    seniorDisplayName: z
      .string()
      .min(2, "Zadejte jméno seniora.")
      .max(80, "Jméno je dlouhé."),
  })
  .strict();

export type OnboardingStartInput = z.infer<typeof onboardingStartSchema>;
