import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * SeniorCard — editorial direction.
 *
 * Wraps the `.es-card` style from globals.css. Generous padding, paper
 * background, ink-tinted shadow. Use inside the (senior) tree only —
 * the styles live under `.editorial-senior`.
 */
export const SeniorCard = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function SeniorCard({ className, ...props }, ref) {
    return <div ref={ref} className={cn("es-card", className)} {...props} />;
  },
);
