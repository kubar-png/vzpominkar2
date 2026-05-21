import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * SeniorButton — editorial direction.
 *
 * Wraps the `.es-btn` family from globals.css `.editorial-senior` scope so
 * any caller inside the (senior) tree gets the editorial gold/outline/dark
 * pills with consistent 64–80px hit targets and AAA contrast.
 *
 * Variant mapping:
 *   primary   = gold pill (navy ink on antique gold, ~9:1 contrast — AAA)
 *   accent    = oxblood pill (white on deep red, ~8.6:1 contrast — AAA)
 *   secondary = outline (navy on cream, ~10:1 — AAA)
 *   ghost     = transparent / subtle (for "Odhlásit" inside the header)
 */
const seniorButtonVariants = cva("es-btn", {
  variants: {
    variant: {
      primary: "es-btn-gold",
      accent: "es-btn-red",
      secondary: "es-btn-outline",
      ghost: "es-btn-outline",
    },
    size: {
      // The editorial pill is already 68px tall by default; modifiers below
      // tweak padding/text size for context.
      md: "",
      lg: "text-[22px] min-h-[76px] px-9",
      xl: "text-[24px] min-h-[88px] px-12",
    },
    block: {
      true: "w-full",
      false: "",
    },
  },
  defaultVariants: { variant: "primary", size: "md", block: false },
});

export interface SeniorButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof seniorButtonVariants> {}

export const SeniorButton = React.forwardRef<HTMLButtonElement, SeniorButtonProps>(
  function SeniorButton({ className, variant, size, block, type = "button", ...props }, ref) {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(seniorButtonVariants({ variant, size, block }), className)}
        {...props}
      />
    );
  },
);

export { seniorButtonVariants };
