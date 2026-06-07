"use client";

import { useState } from "react";

/**
 * "Stáhnout dárkový poukaz (PDF)" — surfaced on the post-payment confirmation
 * screens (/kniha/hotovo for the book paths, /onboarding/zdroj for the app
 * path). The voucher PDF is a purchased artifact: the render route
 * (POST /api/print/voucher) gates on the voucher being PAID, so this button
 * only ever yields a file once the order is settled.
 *
 * The render route returns the PDF as a stream (not a redirectable URL), so we
 * POST the token, read the blob, and trigger a client-side download. On any
 * error we surface a calm message + a mailto fallback (a human can re-send).
 */
export function VoucherDownloadButton({
  token,
  className,
  label = "Stáhnout dárkový poukaz (PDF)",
}: {
  token: string;
  className?: string;
  label?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    if (loading) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/print/voucher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (!res.ok) {
        throw new Error(`render_failed_${res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "darkovy-poukaz-vzpominkar.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      // Revoke after a tick so the download has grabbed the URL.
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setError(
        "Poukaz se zatím nepodařilo připravit. Zkuste to prosím za chvíli, nebo nám napište — pošleme vám ho.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <button
        type="button"
        onClick={handleDownload}
        disabled={loading}
        className={className}
        aria-busy={loading}
      >
        {loading ? "Připravujeme PDF…" : label}
        <span className="arrow" aria-hidden>
          {" "}
          ↓
        </span>
      </button>
      {error ? (
        <span role="alert" style={{ fontSize: "13px", color: "var(--oxblood)", maxWidth: "40ch", textAlign: "center" }}>
          {error}
        </span>
      ) : null}
    </span>
  );
}
