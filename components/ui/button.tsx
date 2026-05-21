import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/* Quiet button system -
 *   Solid pill, no chevron, no border, no rest→hover→active colour rhythm.
 *   The button announces itself through fill colour alone and gets out of
 *   the way; the brand voice lives in the typography and photography
 *   around it. */
const buttonVariants = cva(
  cn(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium",
    "rounded-[6px]",
    "transition-[background-color,color,transform,box-shadow] duration-[var(--duration-normal)] ease-[var(--ease-in-out-cubic)]",
    "disabled:pointer-events-none disabled:opacity-50",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)] focus-visible:ring-[var(--color-focus-ring)]",
  ),
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--color-navy-900)] text-[var(--color-paper-50)] " +
          "hover:bg-[var(--color-navy-800)] active:bg-[var(--color-navy-950)]",
        accent:
          "bg-[var(--color-red-700)] text-[var(--color-paper-50)] " +
          "hover:bg-[var(--color-red-800)] active:bg-[var(--color-red-900)]",
        secondary:
          "bg-[var(--color-surface)] text-[var(--color-navy-900)] " +
          "hover:bg-[var(--color-paper-200)] active:bg-[var(--color-paper-300)]",
        ghost:
          "bg-transparent text-[var(--color-text)] " +
          "hover:bg-[var(--color-paper-200)]",
        link:
          "bg-transparent text-[var(--color-navy-900)] underline-offset-4 hover:underline " +
          "!rounded-none px-0 h-auto",
        danger:
          "bg-[var(--color-red-700)] text-white " +
          "hover:bg-[var(--color-red-800)] active:bg-[var(--color-red-900)]",
      },
      size: {
        sm: "h-9 px-4 text-sm",
        md: "h-10 px-5 text-base",
        lg: "h-12 px-7 text-base tracking-wide",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button({ className, variant, size, type = "button", ...props }, ref) {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  },
);

export { buttonVariants };
