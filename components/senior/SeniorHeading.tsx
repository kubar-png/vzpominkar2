import * as React from "react";
import { cn } from "@/lib/utils";

type Level = 1 | 2 | 3;

const sizeForLevel: Record<Level, string> = {
  1: "text-[var(--text-senior-h1)] leading-[var(--leading-tight)]",
  2: "text-[var(--text-senior-h2)] leading-[var(--leading-snug)]",
  3: "text-[var(--text-senior-h3)] leading-[var(--leading-snug)]",
};

const shadowForLevel: Record<Level, string> = {
  1: "",
  2: "",
  3: "",
};

export interface SeniorHeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level?: Level;
}

export function SeniorHeading({ level = 2, className, children, ...props }: SeniorHeadingProps) {
  const Tag = (`h${level}` as unknown) as "h1" | "h2" | "h3";
  return (
    <Tag
      className={cn(
        "font-[family-name:var(--font-display)] font-normal tracking-tight",
        "text-[var(--color-ink-900)]",
        sizeForLevel[level],
        shadowForLevel[level],
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}
