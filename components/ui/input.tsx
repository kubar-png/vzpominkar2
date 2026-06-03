import * as React from "react";
import { cn } from "@/lib/utils";

type FieldSize = "sm" | "md";

const fieldHeight: Record<FieldSize, string> = {
  sm: "h-9",
  md: "h-10",
};

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  inputSize?: FieldSize;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  function Input({ className, type = "text", inputSize = "md", ...props }, ref) {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          "flex w-full rounded-[var(--radius-md)]",
          fieldHeight[inputSize],
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

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  selectSize?: FieldSize;
}

/**
 * Editorial select — visual twin of <Input>. Same border, focus, height tokens.
 * Custom caret rendered via background SVG so we can keep the cream/navy
 * design language consistent across the owner app.
 */
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  function Select({ className, selectSize = "md", children, ...props }, ref) {
    return (
      <select
        ref={ref}
        className={cn(
          "flex w-full appearance-none rounded-[var(--radius-md)]",
          fieldHeight[selectSize],
          "border border-[var(--color-border-strong)]",
          "bg-[var(--color-surface)] pl-3 pr-9 text-base text-[var(--color-text)]",
          "shadow-[var(--shadow-inset)]",
          "transition-colors duration-[var(--duration-fast)]",
          "focus-visible:border-[var(--color-navy-500)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          // Custom caret (tan chevron) via the .ui-select-caret class below.
          // (The chevron lives in /public/select-caret.svg — an inline SVG
          // data URI here tripped Turbopack and broke `next dev`.)
          "bg-[length:14px_14px] bg-[right_0.75rem_center] bg-no-repeat",
          "ui-select-caret",
          className,
        )}
        {...props}
      >
        {children}
      </select>
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
