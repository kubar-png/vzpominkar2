"use client";

import { useEffect } from "react";

/**
 * Last-resort boundary for errors thrown in the root layout itself. global-error
 * replaces the whole document, so it ships its own <html>/<body> and can't rely
 * on app CSS or fonts — inline styles only.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global] root error", error);
  }, [error]);

  return (
    <html lang="cs">
      <body
        style={{
          fontFamily: "system-ui, -apple-system, sans-serif",
          maxWidth: "36rem",
          margin: "0 auto",
          padding: "5rem 1.5rem",
          color: "#1f2430",
          lineHeight: 1.6,
        }}
      >
        <p
          style={{
            textTransform: "uppercase",
            letterSpacing: "0.3em",
            fontSize: "0.7rem",
            color: "#a8231f",
          }}
        >
          Něco se nepovedlo
        </p>
        <h1 style={{ fontSize: "1.8rem", fontWeight: 600, margin: "0.5rem 0 1rem" }}>
          Stránku se nepodařilo načíst.
        </h1>
        <p style={{ color: "#5b6270" }}>
          Zkuste to prosím znovu. Pokud chyba zůstane, napište nám na ahoj@vzpominkar.com.
        </p>
        <button
          onClick={() => reset()}
          style={{
            marginTop: "1.5rem",
            padding: "0.6rem 1.2rem",
            borderRadius: "0.5rem",
            border: "none",
            background: "#1f2430",
            color: "#fff",
            fontSize: "0.95rem",
            cursor: "pointer",
          }}
        >
          Zkusit znovu
        </button>
      </body>
    </html>
  );
}
