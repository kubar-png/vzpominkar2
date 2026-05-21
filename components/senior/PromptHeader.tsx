import Link from "next/link";
import { SeniorHeading } from "./SeniorHeading";

export function PromptHeader({
  question,
  hint,
}: {
  question: string;
  hint?: string;
}) {
  return (
    <div className="space-y-3">
      <Link
        href="/home"
        className="inline-flex items-center gap-2 text-[var(--text-senior-sm)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
      >
        ← Zpět
      </Link>
      <p className="text-[var(--text-senior)] text-[var(--color-text-muted)]">Otázka:</p>
      <SeniorHeading level={2}>{question}</SeniorHeading>
      {hint ? <p className="text-[var(--text-senior)]">{hint}</p> : null}
    </div>
  );
}
