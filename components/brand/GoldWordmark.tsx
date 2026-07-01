import { Logo } from "./Logo";

/**
 * Back-compat wrapper — renders the brand SVG logo. (Name kept so existing
 * auth/checkout imports keep working; no longer "gold".) Use `tone="offwhite"`
 * on navy backgrounds.
 */
export function GoldWordmark({
  height = 30,
  className,
  tone = "raspberry",
}: {
  height?: number;
  className?: string;
  tone?: "raspberry" | "offwhite";
}) {
  return (
    <Logo variant="full" tone={tone} height={height} className={className} />
  );
}
