/**
 * Image magic-byte sniffing for upload safety. Extracted from the photo-upload
 * action so the (pure) detectors are unit-testable and don't live inside a
 * "use server" module. Magic numbers per
 * https://en.wikipedia.org/wiki/List_of_file_signatures.
 */

/**
 * Inspect the first 12-16 bytes of an image and return the detected MIME, or
 * null if it doesn't match a format we accept.
 */
export function sniffImageMime(head: Uint8Array): string | null {
  if (head.length < 4) return null;
  // JPEG: FF D8 FF
  if (head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) {
    return "image/jpeg";
  }
  // PNG: 89 50 4E 47
  if (
    head[0] === 0x89 &&
    head[1] === 0x50 &&
    head[2] === 0x4e &&
    head[3] === 0x47
  ) {
    return "image/png";
  }
  // GIF: "GIF8"
  if (
    head[0] === 0x47 &&
    head[1] === 0x49 &&
    head[2] === 0x46 &&
    head[3] === 0x38
  ) {
    return "image/gif";
  }
  // WebP: "RIFF" .... "WEBP"
  if (
    head.length >= 12 &&
    head[0] === 0x52 &&
    head[1] === 0x49 &&
    head[2] === 0x46 &&
    head[3] === 0x46 &&
    head[8] === 0x57 &&
    head[9] === 0x45 &&
    head[10] === 0x42 &&
    head[11] === 0x50
  ) {
    return "image/webp";
  }
  // HEIC / HEIF: "....ftyp<brand>" at offset 4
  if (
    head.length >= 12 &&
    head[4] === 0x66 &&
    head[5] === 0x74 &&
    head[6] === 0x79 &&
    head[7] === 0x70
  ) {
    const brand = String.fromCharCode(head[8]!, head[9]!, head[10]!, head[11]!);
    if (
      brand === "heic" ||
      brand === "heix" ||
      brand === "mif1" ||
      brand === "msf1" ||
      brand === "hevc" ||
      brand === "hevx"
    ) {
      return "image/heic";
    }
  }
  return null;
}

export function mimeToExt(mime: string): string | null {
  switch (mime) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/gif":
      return "gif";
    case "image/webp":
      return "webp";
    case "image/heic":
    case "image/heif":
      return "heic";
    default:
      return null;
  }
}
