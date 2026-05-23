export default function SettingsLoading() {
  return (
    <div className="space-y-8 animate-pulse" aria-busy="true">
      <div className="space-y-3">
        <div className="h-3 w-24 rounded-full bg-[var(--color-paper-200)]" />
        <div className="h-10 w-1/2 rounded-md bg-[var(--color-paper-200)]" />
      </div>
      <div className="space-y-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-28 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)]"
          />
        ))}
      </div>
    </div>
  );
}
