/**
 * The gold "Vzpomínkář" wordmark rendered via CSS mask (same technique as the
 * onboarding/app header), so it matches the gold logo used everywhere else.
 * Sized by `height`; width follows the artwork's 1892×390 aspect ratio.
 */
export function GoldWordmark({
  height = 30,
  className,
}: {
  height?: number;
  className?: string;
}) {
  return (
    <span
      role="img"
      aria-label="Vzpomínkář"
      className={className}
      style={{
        display: "inline-block",
        height,
        width: height * (1892 / 390),
        backgroundColor: "var(--gold)",
        WebkitMask: "url('/brand/logo-mask.png') no-repeat center / contain",
        mask: "url('/brand/logo-mask.png') no-repeat center / contain",
      }}
    />
  );
}
