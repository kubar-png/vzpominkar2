import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/* Editorial pill system — primary/secondary mirror the marketing homepage
 * CTA exactly (rounded-full, gold fill or navy outline, 1.5px hairline,
 * Instrument Sans 500, asymmetric padding to feel airy around the optional
 * trailing arrow). Ghost / link / accent / danger stay utilitarian. */
const buttonVariants = cva(
  cn(
    "inline-flex items-center justify-center gap-2.5 whitespace-nowrap font-medium",
    "rounded-full border-[1.5px]",
    "transition-[background-color,color,border-color,transform,box-shadow] duration-[var(--duration-normal)] ease-[var(--ease-in-out-cubic)]",
    "disabled:pointer-events-none disabled:opacity-50",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)] focus-visible:ring-[var(--gold)]",
  ),
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--gold-soft)] border-[var(--gold-soft)] text-[var(--ink)] " +
          "hover:bg-[var(--gold)] hover:border-[var(--gold)] hover:text-[var(--color-navy-900)] hover:-translate-y-px " +
          "active:translate-y-0 active:bg-[var(--gold)]",
        accent:
          "bg-[var(--oxblood,#a8231f)] border-[var(--oxblood,#a8231f)] text-[var(--color-paper-50)] " +
          "hover:bg-[var(--color-red-800)] hover:border-[var(--color-red-800)] active:bg-[var(--color-red-900)]",
        secondary:
          "bg-transparent border-[var(--ink)] text-[var(--ink)] " +
          "hover:bg-[var(--ink)] hover:text-[var(--color-paper-50)]",
        ghost:
          "bg-transparent border-transparent text-[var(--color-text)] " +
          "hover:bg-[var(--color-paper-200)]",
        link:
          "bg-transparent border-transparent text-[var(--ink)] underline-offset-4 hover:underline " +
          "!rounded-none px-0 h-auto",
        danger:
          "bg-[var(--color-red-700)] border-[var(--color-red-700)] text-white " +
          "hover:bg-[var(--color-red-800)] hover:border-[var(--color-red-800)] active:bg-[var(--color-red-900)]",
      },
      size: {
        sm: "h-9 pl-4 pr-3.5 text-[14px]",
        md: "h-10 pl-[22px] pr-[18px] text-[15px]",
        lg: "h-12 pl-7 pr-6 text-[15px] tracking-wide",
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
