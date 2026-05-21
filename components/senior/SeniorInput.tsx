import * as React from "react";
import { cn } from "@/lib/utils";

export const SeniorInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function SeniorInput({ className, type = "text", ...props }, ref) {
  return (
    <input
      ref={ref}
      type={type}
      className={cn(
        "block w-full",
        "min-h-[60px] px-5 py-3",
        "rounded-[var(--radius-senior-input)]",
        "bg-white border-2 border-[var(--color-border-strong)]",
        "text-[var(--text-senior)] leading-relaxed",
        "placeholder:text-[var(--color-text-subtle)]",
        "transition-colors duration-[var(--duration-senior)]",
        "focus-visible:border-[var(--color-navy-500)] focus-visible:outline-none",
        "disabled:opacity-60",
        className,
      )}
      {...props}
    />
  );
});

export const SeniorTextarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function SeniorTextarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(
        "block w-full",
        "min-h-[180px] px-5 py-4",
        "rounded-[var(--radius-senior-input)]",
        "bg-white border-2 border-[var(--color-border-strong)]",
        "text-[var(--text-senior-lg)] leading-relaxed",
        "placeholder:text-[var(--color-text-subtle)]",
        "transition-colors duration-[var(--duration-senior)]",
        "focus-visible:border-[var(--color-navy-500)] focus-visible:outline-none",
        "resize-y",
        className,
      )}
      {...props}
    />
  );
});

export const SeniorLabel = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(function SeniorLabel({ className, ...props }, ref) {
  return (
    <label
      ref={ref}
      className={cn(
        "block mb-2 text-[var(--text-senior)] font-medium",
        "text-[var(--color-text)]",
        className,
      )}
      {...props}
    />
  );
});
