import type { Metadata } from "next";
import { Configurator } from "./configurator";

export const metadata: Metadata = {
  title: "Sestavte si knihu",
  robots: { index: false },
};

// Standalone, app-like full-viewport flow (no marketing Shell chrome → no page
// scroll). The .editorial class keeps the editorial color tokens the .kc styles use.
export default function SestavitPage() {
  return (
    <div className="editorial">
      <Configurator />
    </div>
  );
}
