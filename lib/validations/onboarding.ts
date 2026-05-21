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
    promptIds: z
      .array(z.string().uuid("Neplatná otázka."))
      .min(3, "Vyberte aspoň 3 otázky pro začátek.")
      .max(20, "Pro start stačí maximálně 20 otázek."),
  })
  .strict();

export type OnboardingStartInput = z.infer<typeof onboardingStartSchema>;
