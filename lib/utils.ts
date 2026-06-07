import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format an integer CZK amount the Czech way, e.g. 2890 → "2 890 Kč". */
export function formatCzk(n: number): string {
  return `${Math.round(n).toLocaleString("cs-CZ")} Kč`;
}
