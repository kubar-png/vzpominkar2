import Link from "next/link";

/**
 * PromptHeader — editorial direction.
 *
 * Back link + eyebrow + PP Pangaia italic question. Used by any senior
 * subpage that wants the homepage-style question banner.
 */
export function PromptHeader({
  question,
  hint,
}: {
  question: string;
  hint?: string;
}) {
  return (
    <header className="mb-8">
      <div className="mb-6">
        <Link href="/home" className="es-back-link">
          <span aria-hidden>←</span> Zpět
        </Link>
      </div>
      <span className="es-eyebrow">Vaše otázka</span>
      <h2 className="es-question">{question}</h2>
      {hint ? (
        <p className="mt-4 text-[19px] text-[var(--ink-soft)] leading-relaxed">
          {hint}
        </p>
      ) : null}
      <div className="es-rule-gold" />
    </header>
  );
}
