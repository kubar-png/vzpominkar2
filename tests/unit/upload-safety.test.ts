import { describe, it, expect } from "vitest";
import { sniffImageMime, mimeToExt } from "@/lib/memories/image-sniff";

const bytes = (...b: number[]) => new Uint8Array(b);
// "....ftyp<brand>" HEIC container (brand at offset 8).
const heic = (brand: string) =>
  new Uint8Array([0, 0, 0, 0, 0x66, 0x74, 0x79, 0x70, ...[...brand].map((c) => c.charCodeAt(0))]);

describe("sniffImageMime — magic-byte detection", () => {
  it("accepts real image signatures", () => {
    expect(sniffImageMime(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe("image/jpeg");
    expect(sniffImageMime(bytes(0x89, 0x50, 0x4e, 0x47))).toBe("image/png");
    expect(sniffImageMime(bytes(0x47, 0x49, 0x46, 0x38))).toBe("image/gif");
    expect(
      sniffImageMime(bytes(0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50)),
    ).toBe("image/webp");
    expect(sniffImageMime(heic("heic"))).toBe("image/heic");
    expect(sniffImageMime(heic("mif1"))).toBe("image/heic");
  });

  it("rejects non-image and disguised files", () => {
    expect(sniffImageMime(bytes(0x25, 0x50, 0x44, 0x46))).toBeNull(); // %PDF
    expect(sniffImageMime(bytes(0x4d, 0x5a, 0x90, 0x00))).toBeNull(); // MZ (.exe)
    expect(sniffImageMime(bytes(0x50, 0x4b, 0x03, 0x04))).toBeNull(); // PK (zip/docx)
    expect(sniffImageMime(heic("xxxx"))).toBeNull(); // ftyp but unknown brand
  });

  it("rejects too-short and empty input", () => {
    expect(sniffImageMime(bytes(0xff, 0xd8))).toBeNull();
    expect(sniffImageMime(new Uint8Array())).toBeNull();
  });
});

describe("mimeToExt", () => {
  it("maps accepted mimes to file extensions", () => {
    expect(mimeToExt("image/jpeg")).toBe("jpg");
    expect(mimeToExt("image/png")).toBe("png");
    expect(mimeToExt("image/gif")).toBe("gif");
    expect(mimeToExt("image/webp")).toBe("webp");
    expect(mimeToExt("image/heic")).toBe("heic");
    expect(mimeToExt("image/heif")).toBe("heic");
  });

  it("returns null for unknown mimes", () => {
    expect(mimeToExt("application/pdf")).toBeNull();
    expect(mimeToExt("")).toBeNull();
  });
});
