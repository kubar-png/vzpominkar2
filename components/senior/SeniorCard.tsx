import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * SeniorCard - generous padding, parchment background, warm shadow.
 * Matches the editorial paper aesthetic of the homepage.
 */
export const SeniorCard = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function SeniorCard({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cn(
          "bg-[var(--color-paper-50)] text-[var(--color-text)]",
          "rounded-[var(--radius-senior-card)]",
          "border border-[var(--color-paper-300)]",
          "shadow-[0_4px_24px_rgba(10,44,77,0.10),0_1px_3px_rgba(10,44,77,0.06)]",
          "px-7 py-8 sm:px-10 sm:py-10",
          className,
        )}
        {...props}
      />
    );
  },
);
