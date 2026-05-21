import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant = "full" | "wordmark" | "symbol";

interface LogoProps {
  variant?: Variant;
  invert?: boolean;
  className?: string;
  href?: string;
  /** Visible height in px (defaults vary per variant) */
  size?: number;
}

const SOURCES: Record<Variant, { dark: string; light: string; ratio: number }> = {
  full:      { dark: "/brand/logo.png",            light: "/brand/logo-white.png",        ratio: 1892 / 390 },
  wordmark:  { dark: "/brand/logo-no-tagline.png", light: "/brand/logo-white.png",        ratio: 1892 / 390 },
  symbol:    { dark: "/brand/symbol.png",          light: "/brand/symbol-white.png",      ratio: 1 },
};

export function Logo({ variant = "wordmark", invert = false, className, href, size }: LogoProps) {
  const src = invert ? SOURCES[variant].light : SOURCES[variant].dark;
  const ratio = SOURCES[variant].ratio;
  const h = size ?? (variant === "symbol" ? 36 : 32);
  const w = Math.round(h * ratio);

  const img = (
    <Image
      src={src}
      alt="Vzpomínkář"
      width={w}
      height={h}
      priority
      className={cn(className)}
      style={{ height: h, width: w, maxWidth: "none" }}
    />
  );

  if (href) {
    return (
      <Link href={href} aria-label="Vzpomínkář - domovská stránka" className="inline-flex">
        {img}
      </Link>
    );
  }
  return img;
}
