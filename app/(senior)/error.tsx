"use client";

import { useEffect } from "react";

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
      <span className="es-eyebrow">Chyba</span>
      <h2 className="es-question">Něco se nepovedlo.</h2>
      <p className="text-[19px] text-[var(--ink-soft)] max-w-md">
        Zkuste to prosím ještě jednou. Pokud chyba zůstane, zavolejte rodině.
      </p>
      <button type="button" onClick={reset} className="es-btn es-btn-gold">
        Zkusit znovu <span className="arrow" aria-hidden>↗</span>
      </button>
    </div>
  );
}
