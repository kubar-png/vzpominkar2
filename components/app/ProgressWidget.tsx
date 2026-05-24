import Link from "next/link";
import { getFamilyStats } from "@/lib/family/stats";
import { plural } from "@/lib/format/czech-plural";

const BOOK_FULL = 52;
const BOOK_MIN = 30;

interface ProgressWidgetProps {
  familyId: string;
}

/** Async wrapper — Suspense-friendly, dedups via React cache. */
export async function ProgressWidgetAsync({ familyId }: ProgressWidgetProps) {
  const stats = await getFamilyStats(familyId);

  if (stats.memoryCount === 0) {
    return (
      <section className="vzp-progress-card" aria-label="Postup k hotové knize">
        <p className="vzp-progress-empty">
          Tady bude růst počet vzpomínek směrem k hotové knize.
          Jakmile vám blízký odpoví na první otázku, uvidíte tu postup.
        </p>
      </section>
    );
  }

  const pct = Math.min(100, Math.round((stats.memoryCount / BOOK_FULL) * 100));
  const milestonePct = Math.round((BOOK_MIN / BOOK_FULL) * 100);
  const ready = stats.memoryCount >= BOOK_MIN;
  const remaining = Math.max(0, BOOK_MIN - stats.memoryCount);

  const audioHours = Math.floor(stats.audioSecondsTotal / 3600);
  const audioMinutes = Math.floor((stats.audioSecondsTotal % 3600) / 60);
  const audioLabel =
    audioHours > 0
      ? `${audioHours} h ${audioMinutes} min`
      : audioMinutes > 0
        ? `${audioMinutes} min`
        : null;

  return (
    <section className="vzp-progress-card" aria-label="Postup k hotové knize">
      <div className="vzp-progress-hero">
        <p className="vzp-progress-eyebrow">Vaše kniha vzniká</p>
        <p className="vzp-progress-num">
          {stats.memoryCount}
          <span className="vzp-progress-num-of"> / {BOOK_FULL}</span>
        </p>
        <p className="vzp-progress-sub">
          {plural(stats.memoryCount, ["vzpomínka uložena", "vzpomínky uloženy", "vzpomínek uloženo"])}
        </p>

        <div className="vzp-progress-bar" aria-hidden>
          <div className="vzp-progress-fill" style={{ width: `${pct}%` }} />
          <div
            className="vzp-progress-milestone"
            style={{ left: `${milestonePct}%` }}
          >
            <span className="vzp-progress-milestone-label">Tisk od {BOOK_MIN}</span>
          </div>
        </div>

        <p className="vzp-progress-status">
          {ready
            ? "Kniha má dost stránek — můžete ji objednat, nebo ji nechat ještě růst."
            : `Ještě ${remaining} ${plural(remaining, ["vzpomínka", "vzpomínky", "vzpomínek"])} a knihu lze poslat do tisku.`}
        </p>

        {ready ? (
          <Link href={`/family/${familyId}/book`} className="vzp-progress-cta">
            Objednat knihu <span aria-hidden>↗</span>
          </Link>
        ) : null}
      </div>

      <ul className="vzp-progress-stats">
        <li>
          <span className="vzp-progress-stat-num">~{stats.approxBookPages}</span>
          <span className="vzp-progress-stat-label">
            {plural(stats.approxBookPages, ["strana", "strany", "stran"])} v knize
          </span>
        </li>
        {audioLabel ? (
          <li>
            <span className="vzp-progress-stat-num">{audioLabel}</span>
            <span className="vzp-progress-stat-label">jejich vyprávění</span>
          </li>
        ) : null}
        <li>
          <span className="vzp-progress-stat-num">
            {stats.wordsTotal.toLocaleString("cs-CZ")}
          </span>
          <span className="vzp-progress-stat-label">
            {plural(stats.wordsTotal, ["slovo", "slova", "slov"])}
          </span>
        </li>
        {stats.weekStreak >= 2 ? (
          <li>
            <span className="vzp-progress-stat-num vzp-progress-stat-num-warm">
              {stats.weekStreak}
            </span>
            <span className="vzp-progress-stat-label">
              {plural(stats.weekStreak, ["týden", "týdny", "týdnů"])} v řadě
            </span>
          </li>
        ) : null}
      </ul>
    </section>
  );
}

/** Same outer footprint as the real widget so the dashboard doesn't jump. */
export function ProgressWidgetSkeleton() {
  return (
    <section className="vzp-progress-card" aria-hidden style={{ opacity: 0.55 }}>
      <div className="vzp-progress-hero">
        <div style={{ height: 14, width: 120, marginBottom: 12, background: "rgba(255,255,255,0.08)", borderRadius: 3 }} />
        <div style={{ height: 64, width: 180, marginBottom: 10, background: "rgba(255,255,255,0.08)", borderRadius: 6 }} />
        <div style={{ height: 14, width: 160, marginBottom: 20, background: "rgba(255,255,255,0.06)", borderRadius: 3 }} />
        <div style={{ height: 10, width: "100%", marginBottom: 20, background: "rgba(255,255,255,0.08)", borderRadius: 999 }} />
        <div style={{ height: 14, width: "85%", background: "rgba(255,255,255,0.05)", borderRadius: 3 }} />
      </div>
      <ul className="vzp-progress-stats">
        {[0, 1, 2].map((i) => (
          <li key={i}>
            <div style={{ height: 30, width: 60, marginBottom: 6, background: "rgba(255,255,255,0.08)", borderRadius: 4 }} />
            <div style={{ height: 12, width: 90, background: "rgba(255,255,255,0.05)", borderRadius: 3 }} />
          </li>
        ))}
      </ul>
    </section>
  );
}
