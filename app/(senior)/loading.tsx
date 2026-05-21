export default function SeniorLoading() {
  return (
    <div
      className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-6 text-center"
      aria-busy="true"
    >
      <div
        aria-hidden
        className="h-14 w-14 animate-spin rounded-full border-4 border-[var(--color-paper-300)] border-t-[var(--color-navy-800)]"
      />
      <p className="text-[length:var(--text-senior)] text-paper-600">
        Otevírám Vzpomínkář…
      </p>
    </div>
  );
}
