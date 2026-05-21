import type { Metadata } from "next";
import { Shell } from "@/components/landing/Shell";
import { JakToFungujeClient } from "./JakToFungujeClient";

export const metadata: Metadata = {
  title: "Jak to funguje · Vzpomínkář",
  description:
    "Šest kroků od první otázky k ručně vázané knize vzpomínek. Hlas se proměňuje v příběh, rodina spoluvytváří, kniha vzniká sama.",
};

export default function JakToFungujePage() {
  return (
    <Shell>
      <JakToFungujeClient />
    </Shell>
  );
}
