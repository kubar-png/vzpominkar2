"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Read-only display of the senior's magic link + a copy button. The owner sends
 * it to their blízký (SMS / WhatsApp); one click signs the senior in without a
 * password and lands them on this week's question.
 */
export function SeniorMagicLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — the field stays selectable as a fallback */
    }
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <input
        readOnly
        value={url}
        onFocus={(e) => e.currentTarget.select()}
        aria-label="Odkaz pro vyprávějícího"
        className="flex-1 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 font-mono text-sm text-[var(--color-text)]"
      />
      <Button variant="secondary" size="sm" onClick={copy} className="shrink-0">
        {copied ? (
          <>
            <Check size={14} /> Zkopírováno
          </>
        ) : (
          <>
            <Copy size={14} /> Kopírovat odkaz
          </>
        )}
      </Button>
    </div>
  );
}
