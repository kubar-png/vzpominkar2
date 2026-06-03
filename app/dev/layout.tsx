import { notFound } from "next/navigation";

/**
 * Gate the entire /dev/* tree out of production in one place. Previously only
 * /dev/components guarded itself, so /dev/fonts and /dev/fonts-display shipped
 * to (and were reachable in) production.
 */
export default function DevLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV === "production") notFound();
  return <>{children}</>;
}
