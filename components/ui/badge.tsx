import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-[var(--radius-full)] px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      tone: {
        neutral:
          "bg-[var(--color-paper-100)] text-[var(--color-text)] border border-[var(--color-border)]",
        navy:
          "bg-[var(--color-navy-100)] text-[var(--color-navy-800)] border border-[var(--color-navy-200)]",
        red:
          "bg-[var(--color-red-50)] text-[var(--color-red-700)] border border-[var(--color-red-200)]",
        success:
          "bg-emerald-50 text-emerald-800 border border-emerald-200",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
