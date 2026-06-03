import { describe, it, expect } from "vitest";
import { resolveGender, genderFromSeniorRole } from "@/lib/gender";

describe("resolveGender — {masc|fem} token rendering", () => {
  const sentence = "Kde jsi {vyrůstal|vyrůstala}? Popiš dům, ve kterém jsi {bydlel|bydlela}.";

  it("renders the masculine branch for male", () => {
    expect(resolveGender(sentence, "male")).toBe(
      "Kde jsi vyrůstal? Popiš dům, ve kterém jsi bydlel.",
    );
  });

  it("renders the feminine branch for female", () => {
    expect(resolveGender(sentence, "female")).toBe(
      "Kde jsi vyrůstala? Popiš dům, ve kterém jsi bydlela.",
    );
  });

  it("falls back to the slash form when gender is null", () => {
    expect(resolveGender(sentence, null)).toBe(
      "Kde jsi vyrůstal/a? Popiš dům, ve kterém jsi bydlel/a.",
    );
  });

  it("treats undefined gender like null (slash form)", () => {
    expect(resolveGender("{přidal|přidala}", undefined)).toBe("přidal/a");
  });

  it("collapses the slash form to a shared common prefix only", () => {
    // "hrdý"/"hrdá" share "hrd", so the suffix-only slash form is "hrdý/á".
    expect(resolveGender("Byl jsem {hrdý|hrdá}.", null)).toBe("Byl jsem hrdý/á.");
  });

  it("returns the masculine form unchanged when both branches are identical", () => {
    expect(resolveGender("{stejné|stejné}", null)).toBe("stejné");
  });

  it("leaves text without tokens untouched", () => {
    expect(resolveGender("Žádný token tady není.", "female")).toBe("Žádný token tady není.");
  });

  it("resolves multiple tokens with different lengths in one pass", () => {
    expect(resolveGender("{Měl|Měla} jsi {oblíbený|oblíbenou} kout?", "female")).toBe(
      "Měla jsi oblíbenou kout?",
    );
  });
});

describe("genderFromSeniorRole — default from family-relationship label", () => {
  it("maps female roles to female", () => {
    for (const role of ["babicka", "mama", "prababicka", "teta"]) {
      expect(genderFromSeniorRole(role)).toBe("female");
    }
  });

  it("maps male roles to male", () => {
    for (const role of ["dedecek", "tata", "pradedecek", "stryc"]) {
      expect(genderFromSeniorRole(role)).toBe("male");
    }
  });

  it("returns null for unknown / 'jine' / empty roles", () => {
    expect(genderFromSeniorRole("jine")).toBeNull();
    expect(genderFromSeniorRole(null)).toBeNull();
    expect(genderFromSeniorRole(undefined)).toBeNull();
    expect(genderFromSeniorRole("")).toBeNull();
  });
});
