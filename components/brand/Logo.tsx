import type { CSSProperties } from "react";

/**
 * Brand logo (docs/brand manual). SVG-only, no white plate, no distortion.
 * - variant: "full" (symbol + wordmark) | "symbol"
 * - tone:    "raspberry" (on light) | "offwhite" (on navy / photos)
 * - tagline: adds "Psáno i vyprávěno" (full variant only)
 * Sized by `height`; width follows the artwork aspect ratio.
 */
type LogoVariant = "full" | "symbol";
type LogoTone = "raspberry" | "offwhite";

const FILE: Record<LogoVariant, Record<LogoTone, string>> = {
  full: {
    raspberry: "/brand/logo-malinova.svg",
    offwhite: "/brand/logo-offwhite.svg",
  },
  symbol: {
    raspberry: "/brand/symbol-malinova.svg",
    offwhite: "/brand/symbol-offwhite.svg",
  },
};

const FILE_TAGLINE: Record<LogoTone, string> = {
  raspberry: "/brand/logo-malinova-tagline.svg",
  offwhite: "/brand/logo-offwhite-tagline.svg",
};

export function Logo({
  variant = "full",
  tone = "raspberry",
  tagline = false,
  height = 32,
  className,
  style,
  alt = "Vzpomínkář",
}: {
  variant?: LogoVariant;
  tone?: LogoTone;
  tagline?: boolean;
  height?: number;
  className?: string;
  style?: CSSProperties;
  alt?: string;
}) {
  const src =
    tagline && variant === "full" ? FILE_TAGLINE[tone] : FILE[variant][tone];
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      style={{ display: "block", height, width: "auto", ...style }}
    />
  );
}
