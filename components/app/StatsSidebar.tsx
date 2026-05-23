import type { FamilyStats } from "@/lib/family/stats";

interface StatsSidebarProps {
  stats: FamilyStats;
}

/**
 * Right-side stats card — sticky-positioned, navy paper card sitting
 * inset from top/bottom/right with rounded corners (matches the homepage
 * card visual weight; less heavy than the warm-brown left sidebar).
 *
 * Hidden below 1280px so the main content column never gets squeezed.
 * Empty-state (no published memories yet) shows a warm hint instead of
 * a wall of zeros.
 */
export function StatsSidebar({ stats }: StatsSidebarProps) {
  if (stats.memoryCount === 0) {
    return (
      <aside className="vzp-stats-aside" aria-label="Statistiky rodiny">
        <div className="vzp-stats-card">
          <p className="vzp-stats-empty">
            Tady se objeví vaše čísla, jakmile přibude první vzpomínka.
          </p>
        </div>
      </aside>
    );
  }

  const hero = stats.yearSpan;
  const audioHours = Math.floor(stats.audioSecondsTotal / 3600);
  const audioMinutes = Math.floor((stats.audioSecondsTotal % 3600) / 60);
  const audioLabel =
    audioHours > 0
      ? `${audioHours} h ${audioMinutes} min`
      : audioMinutes > 0
        ? `${audioMinutes} min`
        : "—";

  return (
    <aside className="vzp-stats-aside" aria-label="Statistiky rodiny">
      <div className="vzp-stats-card">
        {/* Hero — life-years covered (only if AI extracted something reliable) */}
        {hero ? (
          <header className="vzp-stats-hero">
            <p className="vzp-stats-eyebrow">Pokrýváte</p>
            <p className="vzp-stats-num-hero">
              {hero.span} <span>let</span>
            </p>
            <p className="vzp-stats-hero-sub">jejich života</p>
            {stats.oldestStoryLabel ? (
              <p className="vzp-stats-hero-meta">
                Od „{stats.oldestStoryLabel}“ až dodnes
              </p>
            ) : (
              <p className="vzp-stats-hero-meta">
                Od roku {hero.min} až dodnes
              </p>
            )}
          </header>
        ) : (
          <header className="vzp-stats-hero">
            <p className="vzp-stats-eyebrow">Vašich vzpomínek</p>
            <p className="vzp-stats-num-hero">
              {stats.memoryCount}
            </p>
            <p className="vzp-stats-hero-sub">zaznamenaných</p>
          </header>
        )}

        <div className="vzp-stats-rule" aria-hidden />

        <ul className="vzp-stats-list">
          <li>
            <span className="vzp-stats-num">~{stats.approxBookPages}</span>
            <span className="vzp-stats-label">
              {pluralPages(stats.approxBookPages)} knihy hotových
            </span>
          </li>
          {stats.audioSecondsTotal > 0 ? (
            <li>
              <span className="vzp-stats-num">{audioLabel}</span>
              <span className="vzp-stats-label">jejich hlasu uloženo</span>
            </li>
          ) : null}
          <li>
            <span className="vzp-stats-num">{formatThousands(stats.wordsTotal)}</span>
            <span className="vzp-stats-label">
              {pluralWords(stats.wordsTotal)} zachycených
            </span>
          </li>
          <li>
            <span className="vzp-stats-num">{stats.weeksSinceStart}.</span>
            <span className="vzp-stats-label">
              {pluralWeek(stats.weeksSinceStart)} sbírání
            </span>
          </li>
          {stats.weekStreak >= 2 ? (
            <li>
              <span className="vzp-stats-num vzp-stats-num-warm">
                {stats.weekStreak}×
              </span>
              <span className="vzp-stats-label">
                {pluralWeek(stats.weekStreak)} v řadě bez přestávky
              </span>
            </li>
          ) : null}
        </ul>

        {stats.startedAt ? (
          <p className="vzp-stats-footer">
            Začali jste {formatStartedAt(stats.startedAt)}.
          </p>
        ) : null}
      </div>
    </aside>
  );
}

function formatThousands(n: number): string {
  return n.toLocaleString("cs-CZ").replace(/ /g, " ");
}

function pluralPages(n: number): string {
  if (n === 1) return "strana";
  if (n >= 2 && n <= 4) return "strany";
  return "stran";
}

function pluralWords(n: number): string {
  if (n === 1) return "slovo";
  if (n >= 2 && n <= 4) return "slova";
  return "slov";
}

function pluralWeek(n: number): string {
  if (n === 1) return "týden";
  if (n >= 2 && n <= 4) return "týdny";
  return "týdnů";
}

function formatStartedAt(iso: string): string {
  return new Date(iso).toLocaleDateString("cs-CZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
