import * as React from "react";
import { cn } from "@/lib/utils";

type Level = 1 | 2 | 3;

/**
 * SeniorHeading — editorial direction.
 *
 * Inherits the heading sizes from the `.editorial-senior` scope, so callers
 * don't have to repeat the clamp() formula. Pass `emphasis` to opt into the
 * display-serif voice (weight + color, no italics) used for the weekly
 * question and similar callouts.
 */
export interface SeniorHeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level?: Level;
  emphasis?: boolean;
}

export function SeniorHeading({
  level = 2,
  className,
  emphasis = false,
  children,
  ...props
}: SeniorHeadingProps) {
  const Tag = (`h${level}` as unknown) as "h1" | "h2" | "h3";
  return (
    <Tag className={cn(emphasis ? "es-question" : "", className)} {...props}>
      {children}
    </Tag>
  );
}
