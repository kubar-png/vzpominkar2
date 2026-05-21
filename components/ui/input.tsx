import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, type = "text", ...props }, ref) {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          "flex h-10 w-full rounded-[var(--radius-md)]",
          "border border-[var(--color-border-strong)]",
          "bg-[var(--color-surface)] px-3 py-2 text-base",
          "shadow-[var(--shadow-inset)]",
          "placeholder:text-[var(--color-text-subtle)]",
          "transition-colors duration-[var(--duration-fast)]",
          "focus-visible:border-[var(--color-navy-500)]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      />
    );
  },
);

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-24 w-full rounded-[var(--radius-md)]",
        "border border-[var(--color-border-strong)]",
        "bg-[var(--color-surface)] px-3 py-2 text-base leading-relaxed",
        "shadow-[var(--shadow-inset)]",
        "placeholder:text-[var(--color-text-subtle)]",
        "transition-colors duration-[var(--duration-fast)]",
        "focus-visible:border-[var(--color-navy-500)]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
});

export const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(function Label({ className, ...props }, ref) {
  return (
    <label
      ref={ref}
      className={cn(
        "text-sm font-medium text-[var(--color-text)] leading-none",
        "select-none",
        className,
      )}
      {...props}
    />
  );
});
