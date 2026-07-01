/* Mobile-only sticky buy bar — jumps to the packages section. Prices are
 * hidden during the testing phase, so it shows the free-trial label instead. */
export function StickyBar() {
  return (
    <div className="pl-sticky">
      <div className="pl-sticky__pi">
        <div className="l">Kniha vzpomínek</div>
        <div className="v">zatím zdarma</div>
      </div>
      <a className="pl-btn pl-btn--primary pl-btn--sm" href="#balicky">Koupit knihu</a>
    </div>
  );
}
