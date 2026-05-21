import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * SeniorButton - homepage colour rhythm (navy↔gold↔red) in a large, rounded,
 * touch-friendly shell. No chevron - just generous padding and clear contrast.
 *
 *   accent   = heritage-red  → gold on hover → navy on active  (audio CTA)
 *   primary  = navy-900      → gold on hover → red on active   (text CTA)
 *   secondary = paper-200    → gold on hover → red on active   (photo / ghost CTA)
 */
const seniorButtonVariants = cva(
  cn(
    "inline-flex items-center justify-center gap-3",
    "font-[family-name:var(--font-display)] font-semibold leading-none",
    "rounded-[var(--radius-senior-button)]",
    "transition-[background-color,color,box-shadow] duration-[var(--duration-senior)] ease-[var(--ease-out-quart)]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-navy-500)]",
    "disabled:opacity-60 disabled:cursor-not-allowed",
    "select-none",
  ),
  {
    variants: {
      variant: {
        primary:
          "bg-navy-900 !text-white shadow-[var(--shadow-md)] " +
          "hover:bg-gold-400 hover:!text-navy-900 hover:shadow-[var(--shadow-lg)] " +
          "active:bg-red-700 active:!text-white active:translate-y-px active:shadow-[var(--shadow-sm)]",
        accent:
          "bg-red-700 !text-white shadow-[var(--shadow-md)] " +
          "hover:bg-gold-400 hover:!text-navy-900 hover:shadow-[var(--shadow-lg)] " +
          "active:bg-navy-900 active:!text-white active:translate-y-px active:shadow-[var(--shadow-sm)]",
        secondary:
          "bg-paper-200 !text-navy-900 border-2 border-navy-700 " +
          "hover:bg-gold-400 hover:!text-navy-900 hover:border-gold-400 " +
          "active:bg-red-700 active:!text-white active:border-red-700 active:translate-y-px",
        ghost:
          "bg-transparent !text-paper-300 border-2 border-paper-600 " +
          "hover:bg-navy-800 hover:!text-paper-100 hover:border-paper-400",
      },
      size: {
        md: "min-h-[60px] px-7 text-[var(--text-senior)]",
        lg: "min-h-[72px] px-9 text-[var(--text-senior-lg)]",
        xl: "min-h-[88px] px-12 text-[var(--text-senior-h3)]",
      },
      block: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: { variant: "primary", size: "lg", block: false },
  },
);

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
