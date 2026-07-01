import { getFamilyStats, type FamilyStats } from "@/lib/family/stats";
import { plural } from "@/lib/format/czech-plural";

interface StatsSidebarProps {
  stats: FamilyStats;
}

/** Async wrapper used inside <Suspense> in the app layout. Fetches stats so
 * the shell can paint immediately and the card streams in when ready. */
export async function StatsSidebarAsync({ familyId }: { familyId: string }) {
  const stats = await getFamilyStats(familyId);
  return <StatsSidebar stats={stats} />;
}

/** Skeleton shown while StatsSidebarAsync is loading. Same outer dimensions
 * so the layout doesn't reflow when real content arrives. */
export function StatsSidebarSkeleton() {
  return (
    <aside className="vzp-stats-aside" aria-hidden>
      <div className="vzp-stats-card" style={{ opacity: 0.6 }}>
        <div style={{ height: 28, width: "55%", marginBottom: 12, background: "rgba(255,255,255,0.06)", borderRadius: 4 }} />
        <div style={{ height: 56, width: "70%", marginBottom: 16, background: "rgba(255,255,255,0.08)", borderRadius: 6 }} />
        <div style={{ height: 14, width: "80%", marginBottom: 28, background: "rgba(255,255,255,0.05)", borderRadius: 4 }} />
        <div style={{ height: 1, background: "rgba(255,255,255,0.08)", marginBottom: 20 }} />
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ height: 14, width: "20%", background: "rgba(255,255,255,0.06)", borderRadius: 3 }} />
            <div style={{ height: 14, width: "45%", background: "rgba(255,255,255,0.05)", borderRadius: 3 }} />
          </div>
        ))}
      </div>
    </aside>
  );
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
        : stats.audioSecondsTotal > 0
          ? `${stats.audioSecondsTotal} s`
          : "—";

  return (
    <aside className="vzp-stats-aside" aria-label="Statistiky rodiny">
      <div className="vzp-stats-card">
        {/* Hero — life-years covered (only if AI extracted something reliable) */}
        {hero ? (
          <header className="vzp-stats-hero">
            <p className="vzp-stats-num-hero">
              {hero.span} <span>{plural(hero.span, ["rok", "roky", "let"])}</span>
            </p>
            <p className="vzp-stats-hero-sub">jejich života</p>
            {stats.oldestStoryLabel ? (
              <p className="vzp-stats-hero-meta">
                Od {stats.oldestStoryLabel.toLowerCase()} až dodnes
              </p>
            ) : (
              <p className="vzp-stats-hero-meta">
                Od roku {hero.min} až dodnes
              </p>
            )}
          </header>
        ) : (
          <header className="vzp-stats-hero">
            <p className="vzp-stats-num-hero">
              {stats.memoryCount} <span>{plural(stats.memoryCount, ["vzpomínka", "vzpomínky", "vzpomínek"])}</span>
            </p>
            <p className="vzp-stats-hero-sub">v knize</p>
          </header>
        )}

        <div className="vzp-stats-rule" aria-hidden />

        <ul className="vzp-stats-list">
          <li>
            <span className="vzp-stats-num">~{stats.approxBookPages}</span>
            <span className="vzp-stats-label">
              {plural(stats.approxBookPages, ["strana", "strany", "stran"])} v hotové knize
            </span>
          </li>
          {stats.audioSecondsTotal > 0 ? (
            <li>
              <span className="vzp-stats-num">{audioLabel}</span>
              <span className="vzp-stats-label">jejich vyprávění</span>
            </li>
          ) : null}
          <li>
            <span className="vzp-stats-num">{formatThousands(stats.wordsTotal)}</span>
            <span className="vzp-stats-label">
              {plural(stats.wordsTotal, ["slovo", "slova", "slov"])} v knize
            </span>
          </li>
          <li>
            <span className="vzp-stats-num">
              {stats.daysSinceStart} {plural(stats.daysSinceStart, ["den", "dny", "dní"])}
            </span>
            <span className="vzp-stats-label">vzpomínky sbíráte</span>
          </li>
          {stats.weekStreak >= 2 ? (
            <li>
              <span className="vzp-stats-num vzp-stats-num-warm">
                {stats.weekStreak}
              </span>
              <span className="vzp-stats-label">
                {plural(stats.weekStreak, ["týden", "týdny", "týdnů"])} v řadě
              </span>
            </li>
          ) : null}
        </ul>

        {stats.startedAt ? (
          <p className="vzp-stats-footer">
            Spolu od {formatStartedAt(stats.startedAt)}
          </p>
        ) : null}
      </div>
    </aside>
  );
}

function formatThousands(n: number): string {
  return n.toLocaleString("cs-CZ").replace(/ /g, " ");
}

function formatStartedAt(iso: string): string {
  return new Date(iso).toLocaleDateString("cs-CZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
