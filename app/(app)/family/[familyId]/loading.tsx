/**
 * Loading skeleton shared by all /family/[familyId]/* sub-pages
 * (memories, rodina, prompts, book). Keeps the perceived navigation
 * instant — the layout (sidebar, progress bar) stays mounted while
 * this skeleton stands in for the sub-segment.
 */
export default function FamilyLoading() {
  return (
    <div className="space-y-8 animate-pulse" aria-busy="true">
      <div className="space-y-3">
        <div className="h-3 w-24 rounded-full bg-[var(--color-paper-200)]" />
        <div className="h-10 w-2/3 rounded-md bg-[var(--color-paper-200)]" />
        <div className="h-4 w-1/2 rounded-full bg-[var(--color-paper-200)]" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-20 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)]"
          />
        ))}
      </div>
    </div>
  );
}
