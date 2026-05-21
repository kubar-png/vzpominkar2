import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Senior input primitives — editorial direction.
 *
 * Wrap the `.es-input`, `.es-textarea`, `.es-label` rules from globals.css.
 * 20px text, 64px+ height, navy focus ring, AAA contrast on the cream
 * paper canvas.
 */
export const SeniorInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function SeniorInput({ className, type = "text", ...props }, ref) {
  return (
    <input
      ref={ref}
      type={type}
      className={cn("es-input", className)}
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
      className={cn("es-textarea", className)}
      {...props}
    />
  );
});

export const SeniorLabel = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(function SeniorLabel({ className, ...props }, ref) {
  return <label ref={ref} className={cn("es-label", className)} {...props} />;
});
