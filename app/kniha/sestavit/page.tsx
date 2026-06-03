import type { Metadata } from "next";
import { Shell } from "@/components/landing/Shell";
import { Configurator } from "./configurator";

export const metadata: Metadata = {
  title: "Sestavte si knihu",
  robots: { index: false },
};

export default function SestavitPage() {
  return (
    <Shell>
      <Configurator />
    </Shell>
  );
}
