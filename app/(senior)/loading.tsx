export default function SeniorLoading() {
  return (
    <div
      className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-6 text-center"
      aria-busy="true"
    >
      <div
        aria-hidden
        className="h-14 w-14 animate-spin rounded-full"
        style={{
          border: "4px solid rgba(27, 46, 77, 0.15)",
          borderTopColor: "var(--ink)",
        }}
      />
      <p className="text-[19px]" style={{ color: "var(--ink-soft)" }}>
        Otevírám Vzpomínkář…
      </p>
    </div>
  );
}
