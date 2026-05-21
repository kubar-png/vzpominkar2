import { describe, it, expect } from "vitest";
import {
  buildSeniorEmail,
  isSyntheticEmail,
  isValidUsername,
  normalizeUsername,
} from "@/lib/auth/senior-auth";

describe("senior-auth", () => {
  describe("buildSeniorEmail", () => {
    it("creates a synth email under the internal domain", () => {
      const email = buildSeniorEmail("11111111-1111-1111-1111-111111111111");
      expect(email).toBe("senior-11111111-1111-1111-1111-111111111111@vzpominkar.internal");
    });
  });

  describe("isSyntheticEmail", () => {
    it("recognises internal-domain synth addresses", () => {
      expect(isSyntheticEmail("senior-abc@vzpominkar.internal")).toBe(true);
    });
    it("rejects real addresses", () => {
      expect(isSyntheticEmail("babicka@example.com")).toBe(false);
    });
    it("handles null/undefined safely", () => {
      expect(isSyntheticEmail(null)).toBe(false);
      expect(isSyntheticEmail(undefined)).toBe(false);
    });
  });

  describe("isValidUsername", () => {
    it.each([
      ["babicka", true],
      ["babicka.marie", true],
      ["jan_novak", true],
      ["a-b-c", true],
      ["babi3", true],
    ])("accepts %s", (u, expected) => {
      expect(isValidUsername(u)).toBe(expected);
    });

    it.each([
      // Too short / too long
      ["ab", false],
      ["x".repeat(33), false],
      // Starts with number
      ["1abc", false],
      // Diacritics — must be dictateable over phone
      ["babička", false],
      // Uppercase
      ["Babicka", false],
      // Disallowed chars
      ["babi cka", false],
      ["babi+cka", false],
    ])("rejects %s", (u, expected) => {
      expect(isValidUsername(u)).toBe(expected);
    });
  });

  describe("normalizeUsername", () => {
    it("trims and lowercases", () => {
      expect(normalizeUsername("  Babicka.Marie  ")).toBe("babicka.marie");
    });
  });
});
