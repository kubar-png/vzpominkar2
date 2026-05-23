import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/* Editorial pill system — primary/secondary match the homepage CTA language
 * (rounded-full, gold fill or navy outline). Ghost / link / accent / danger
 * stay utilitarian for non-primary actions. Primary uses brand gold with
 * navy ink for AAA contrast. */
const buttonVariants = cva(
  cn(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium",
    "rounded-full border",
    "transition-[background-color,color,border-color,transform,box-shadow] duration-[var(--duration-normal)] ease-[var(--ease-in-out-cubic)]",
    "disabled:pointer-events-none disabled:opacity-50",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)] focus-visible:ring-[var(--color-focus-ring)]",
  ),
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--gold)] border-[var(--gold)] text-[var(--ink)] " +
          "hover:bg-[var(--gold-soft)] hover:border-[var(--gold-soft)] hover:-translate-y-px " +
          "active:translate-y-0 active:bg-[var(--gold)]",
        accent:
          "bg-[var(--color-red-700)] border-[var(--color-red-700)] text-[var(--color-paper-50)] " +
          "hover:bg-[var(--color-red-800)] hover:border-[var(--color-red-800)] active:bg-[var(--color-red-900)]",
        secondary:
          "bg-transparent border-[var(--color-navy-900)] text-[var(--color-navy-900)] " +
          "hover:bg-[var(--color-navy-900)] hover:text-[var(--color-paper-50)]",
        ghost:
          "bg-transparent border-transparent text-[var(--color-text)] " +
          "hover:bg-[var(--color-paper-200)]",
        link:
          "bg-transparent border-transparent text-[var(--color-navy-900)] underline-offset-4 hover:underline " +
          "!rounded-none px-0 h-auto",
        danger:
          "bg-[var(--color-red-700)] border-[var(--color-red-700)] text-white " +
          "hover:bg-[var(--color-red-800)] hover:border-[var(--color-red-800)] active:bg-[var(--color-red-900)]",
      },
      size: {
        sm: "h-9 px-4 text-sm",
        md: "h-10 px-5 text-base",
        lg: "h-12 px-7 text-base tracking-wide",
        icon: "h-10 w-10 border-transparent",
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
