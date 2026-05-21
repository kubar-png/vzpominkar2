"use client";

import { useEffect } from "react";
import { SeniorButton } from "@/components/senior/SeniorButton";
import { SeniorHeading } from "@/components/senior/SeniorHeading";

export default function SeniorError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[senior] route error", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-6 text-center">
      <SeniorHeading level={2}>Něco se nepovedlo.</SeniorHeading>
      <p className="text-[length:var(--text-senior)] text-paper-600 max-w-md">
        Zkuste to prosím ještě jednou. Pokud chyba zůstane, zavolejte rodině.
      </p>
      <SeniorButton variant="primary" size="md" onClick={reset}>
        Zkusit znovu
      </SeniorButton>
    </div>
  );
}
