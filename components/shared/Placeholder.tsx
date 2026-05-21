import Image from "next/image";
import { cn } from "@/lib/utils";

type Kind = "image" | "video" | "logoStrip" | "avatar";

type Tone = "navy" | "red";

interface PlaceholderProps {
  kind?: Kind;
  /** Intrinsic width - used for the dimension label and as fallback aspect ratio */
  w?: number;
  /** Intrinsic height - used for the dimension label and as fallback aspect ratio */
  h?: number;
  /** Override aspect ratio explicitly (e.g. "16/9", "1/1"). Falls back to w/h. */
  aspect?: string;
  /** Caption shown centered. Defaults to "{w}×{h}". */
  label?: string;
  /** Extra classes - sizing/positioning lives on the wrapper. */
  className?: string;
  /** Make corners pill-round (for avatars). */
  rounded?: boolean;
  /** Gradient palette. "navy" is the default brand placeholder; "red" is used
   * in the gifting (oxblood) section so the imagery participates in that
   * chord instead of clashing against it. */
  tone?: Tone;
  /** When set, renders the real image (next/image with fill + cover) instead
   * of the brand gradient. Keeps the video play overlay so the same slot can
   * carry a poster frame. The label is hidden when src is present. */
  src?: string;
  /** Alt text for the image. Required when `src` is set. */
  alt?: string;
  /** Sizes attribute passed to next/image - tune per layout slot for the right
   * served width. Defaults to a sensible 100vw value. */
  sizes?: string;
  /** Mark as LCP-priority. Only the hero portrait should use this. */
  priority?: boolean;
}

export function Placeholder({
  kind = "image",
  w = 800,
  h = 600,
  aspect,
  label,
  className,
  rounded = false,
  tone = "navy",
  src,
  alt,
  sizes = "(min-width: 1024px) 50vw, 100vw",
  priority = false,
}: PlaceholderProps) {
  const ratio = aspect ?? `${w} / ${h}`;
  const caption = label ?? `${w}×${h}`;
  const isAvatar = kind === "avatar" || rounded;
  const isLogo = kind === "logoStrip";
  const isVideo = kind === "video";
  const isRed = tone === "red";
  const hasImage = Boolean(src);

  /* Gradients walk from a lighter shade (catching the upper-left light) through
   * the brand mid to a deep base - same drama on both palettes. */
  const gradient = isRed
    ? "linear-gradient(135deg, var(--color-red-400) 0%, var(--color-red-700) 50%, var(--color-red-900) 100%)"
    : "linear-gradient(135deg, var(--color-navy-400) 0%, var(--color-navy-700) 50%, var(--color-navy-900) 100%)";

  /* On red, the usual red corner-dot disappears - swap to heritage gold so the
   * brand "stamp" stays visible. Same logic for the play button: on red, a red
   * fill would vanish, so use cream. */
  const accentDot = isRed ? "bg-[var(--color-gold-400)]" : "bg-[var(--color-red-700)]";
  const playFill = isRed ? "bg-[var(--color-paper-100)] text-[var(--color-red-900)]" : "bg-[var(--color-red-700)] text-white";

  return (
    <div
      role="img"
      aria-label={hasImage && alt ? alt : `Placeholder: ${caption}`}
      style={{
        aspectRatio: ratio,
        backgroundImage: hasImage ? undefined : gradient,
      }}
      className={cn(
        "relative isolate w-full overflow-hidden bg-[var(--color-paper-200)]",
        isAvatar
          ? "rounded-[var(--radius-full)]"
          : "rounded-[var(--radius-3xl)]",
        className,
      )}
    >
      {/* Real image - fills the frame with object-cover. Rendered first so all
       * overlays (play button, accent dot) sit above it. */}
      {hasImage && src ? (
        <Image
          src={src}
          alt={alt ?? caption}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover"
        />
      ) : (
        <>
          {/* Subtle diagonal hatch - pale lines for tooth without the foil glint */}
          <svg
            aria-hidden
            className="absolute inset-0 h-full w-full opacity-[0.08] mix-blend-screen"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern
                id="vzp-hatch"
                width="14"
                height="14"
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(45)"
              >
                <line
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="14"
                  stroke="var(--color-paper-50)"
                  strokeWidth="1.5"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#vzp-hatch)" />
          </svg>

          {/* Soft inner sheen - light catching the upper-left edge */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-50"
            style={{
              backgroundImage:
                "radial-gradient(ellipse at 22% 18%, rgba(245,241,232,0.35) 0%, rgba(245,241,232,0) 55%)",
            }}
          />

          {/* Centered label - only on gradient placeholders */}
          <div className="absolute inset-0 flex items-center justify-center px-4 text-center">
            <span
              className={cn(
                "font-[family-name:var(--font-display)] text-[var(--color-paper-100)]",
                isLogo
                  ? "text-sm uppercase tracking-[0.2em]"
                  : isAvatar
                    ? "text-xs"
                    : "text-base",
              )}
            >
              {caption}
            </span>
          </div>
        </>
      )}

      {/* Brand-stamp accent - visible on both gradient + image variants */}
      {!isAvatar && !isLogo && (
        <div
          aria-hidden
          className={cn(
            "absolute right-3 top-3 h-3 w-3 rounded-[var(--radius-xs)]",
            accentDot,
          )}
        />
      )}

      {/* Video play glyph - kept above image so posters get the play affordance */}
      {isVideo && (
        <div
          aria-hidden
          className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-[140%] items-center justify-center"
        >
          <div
            className={cn(
              "flex h-16 w-16 items-center justify-center rounded-[var(--radius-full)] shadow-[var(--shadow-lg)]",
              playFill,
            )}
          >
            <svg
              aria-hidden
              width="20"
              height="22"
              viewBox="0 0 20 22"
              fill="currentColor"
            >
              <path d="M2 1.5v19l16-9.5L2 1.5z" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}
