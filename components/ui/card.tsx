import * as React from "react";
import { cn } from "@/lib/utils";

/* Card primitive for the owner app.
 *
 * Linear/Cron-leaning visual: pure white surface that lifts off the cream
 * page background via a single hairline border. No baseline shadow — the
 * surface should feel weightless. A subtle elevation is reserved for the
 * hover state on interactive cards (apply via the `app-card-hover` utility
 * class declared in globals.css). True overlays use the toast / modal
 * shadow tokens. */
export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function Card({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cn(
          "bg-white text-[var(--color-text)]",
          "rounded-[var(--radius-xl)] border border-[var(--color-border)]",
          className,
        )}
        {...props}
      />
    );
  },
);

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function CardHeader({ className, ...props }, ref) {
    return <div ref={ref} className={cn("p-6 pb-3", className)} {...props} />;
  },
);

export const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(function CardTitle({ className, ...props }, ref) {
  return (
    <h3
      ref={ref}
      className={cn(
        // 17px Inter, weight 600 — the Linear card-title spec from the brief
        "text-[17px] font-semibold tracking-tight",
        "text-[var(--color-navy-900)]",
        className,
      )}
      {...props}
    />
  );
});

export const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(function CardDescription({ className, ...props }, ref) {
  return (
    <p
      ref={ref}
      className={cn("text-sm text-[var(--color-text-muted)]", className)}
      {...props}
    />
  );
});

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function CardContent({ className, ...props }, ref) {
    return <div ref={ref} className={cn("p-6 pt-3", className)} {...props} />;
  },
);

export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function CardFooter({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cn("flex items-center gap-2 p-6 pt-0", className)}
        {...props}
      />
    );
  },
);
