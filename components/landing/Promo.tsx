/**
 * Top promo strip - slides down on first paint via [data-promo-banner] CSS.
 * Wholly presentational; the strap-line copy lives here for now (will move to
 * a config later when we set up campaign management).
 */
export function Promo() {
  return (
    <div data-promo-banner className="bg-[var(--color-navy-900)] text-[var(--color-paper-100)]">
      <div className="mx-auto flex max-w-[var(--container-wide)] items-center justify-center gap-4 px-6 py-2.5">
        <span className="text-sm">
          Vytvořte vzpomínkovou knihu — v testovací verzi zdarma
        </span>
      </div>
    </div>
  );
}
