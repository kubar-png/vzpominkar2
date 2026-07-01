import { Bree_Serif, Host_Grotesk } from "next/font/google";
import "./styles.css";

/* Type system for the /pribeh landing — aligned to the 2026 brand identity
 * (docs/brand): Bree Serif (display, 400 only) for headings, Host Grotesk
 * (humanist sans) for body. Exposed as CSS vars consumed by styles.css. */
const breeSerif = Bree_Serif({
  subsets: ["latin", "latin-ext"],
  weight: "400",
  variable: "--pl-fraunces",
  display: "swap",
});

const hostGrotesk = Host_Grotesk({
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--pl-hanken",
  display: "swap",
});

export default function PribehLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${breeSerif.variable} ${hostGrotesk.variable} pl`}>{children}</div>;
}
