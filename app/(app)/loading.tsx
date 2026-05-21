export default function AppLoading() {
  return (
    <div className="space-y-10 animate-pulse" aria-busy="true">
      <div className="space-y-3">
        <div className="h-3 w-24 rounded-full bg-[var(--color-paper-200)]" />
        <div className="h-12 w-2/3 rounded-md bg-[var(--color-paper-200)]" />
        <div className="h-4 w-1/2 rounded-full bg-[var(--color-paper-200)]" />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-40 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)]"
          />
        ))}
      </div>
    </div>
  );
}
