/**
 * Top promo strip - slides down on first paint via [data-promo-banner] CSS.
 * Wholly presentational; the strap-line copy lives here for now (will move to
 * a config later when we set up campaign management).
 */
export function Promo() {
  return (
    <div data-promo-banner className="bg-[var(--color-navy-900)] text-[var(--color-paper-100)]">
      <div className="mx-auto flex max-w-[var(--container-wide)] items-center justify-center gap-4 px-6 py-2.5">
        <span className="font-[family-name:var(--font-display)] text-sm">
          Sleva 200 Kč pro nové rodiny — pošleme e-mailem
          <span className="ml-2 text-[10px] not-italic uppercase tracking-[0.32em] text-[var(--color-gold-300)]">
            ochutnávka
          </span>
        </span>
      </div>
    </div>
  );
}
