"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app] route error", error);
  }, [error]);

  return (
    <div className="space-y-6 max-w-prose">
      <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-[var(--color-red-700)]">
        Něco se nepovedlo
      </p>
      <h1 className="font-[family-name:var(--font-display)] text-4xl font-medium leading-tight tracking-tight text-[var(--color-navy-900)]">
        Stránku se nepodařilo načíst.
      </h1>
      <p className="text-[var(--color-text-muted)]">
        Zkuste to prosím znovu. Pokud chyba zůstane, napište nám.
      </p>
      <Button onClick={reset} size="sm">
        Zkusit znovu
      </Button>
    </div>
  );
}
