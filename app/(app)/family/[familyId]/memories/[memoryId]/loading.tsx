export default function MemoryDetailLoading() {
  return (
    <div className="space-y-8 animate-pulse" aria-busy="true">
      <div className="h-3 w-32 rounded-full bg-[var(--color-paper-200)]" />
      <div className="space-y-3">
        <div className="h-3 w-24 rounded-full bg-[var(--color-paper-200)]" />
        <div className="h-10 w-3/4 rounded-md bg-[var(--color-paper-200)]" />
      </div>
      <div className="h-32 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)]" />
      <div className="space-y-3">
        <div className="h-4 w-full rounded-full bg-[var(--color-paper-200)]" />
        <div className="h-4 w-full rounded-full bg-[var(--color-paper-200)]" />
        <div className="h-4 w-4/5 rounded-full bg-[var(--color-paper-200)]" />
        <div className="h-4 w-full rounded-full bg-[var(--color-paper-200)]" />
        <div className="h-4 w-3/4 rounded-full bg-[var(--color-paper-200)]" />
      </div>
    </div>
  );
}
