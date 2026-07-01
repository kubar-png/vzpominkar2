import { Icon } from "./Icon";
import { Placeholder } from "./Placeholder";

export function Hero() {
  return (
    <header className="pl-hero" id="top">
      <div className="pl-container pl-hero__grid">
        <div className="pl-hero__copy">
          {/* Pracovní headline — finální znění se dolaďuje. */}
          <h1>
            Chci znát celý{" "}
            <span className="pl-mark">
              tvůj příběh
              <svg viewBox="0 0 300 20" preserveAspectRatio="none" aria-hidden="true">
                <path d="M4 13C70 4 150 4 210 10S288 16 296 7" pathLength={1} />
              </svg>
            </span>
          </h1>
          <p className="pl-lede">
            Konečně dárek, na který nezapomenou. Vázaná kniha s 300 otázkami, kterou darujete blízkému —
            a on ji vlastními slovy promění v rodinný příběh.
          </p>

          <div className="pl-hero__cta">
            <a className="pl-btn pl-btn--primary" href="#balicky">Koupit knihu</a>
            <a className="pl-link" href="#jak">
              Jak to funguje <Icon name="arrow-down" size={15} />
            </a>
          </div>

          {/* Důvěryhodnostní prvek — čísla jsou PLACEHOLDER, doplň reálná po spuštění. */}
          <div className="pl-hero__trust">
            <div className="pl-hero__avatars" aria-hidden="true">
              <Placeholder label="" showIcon={false} />
              <Placeholder label="" showIcon={false} />
              <Placeholder label="" showIcon={false} />
            </div>
            <div className="pl-hero__trust-txt">
              <span className="pl-stars" aria-hidden="true">
                {Array.from({ length: 5 }).map((_, i) => <Icon key={i} name="star" size={16} />)}
              </span>
              <div><b>4,9 z 5</b> — doporučují darující rodiny</div>
            </div>
          </div>
        </div>

        <div className="pl-hero__visual">
          <div className="pl-book" aria-label="Ukázka obálky knihy">
            <span className="pl-book__frame" aria-hidden="true" />
            <span className="pl-book__badge">300 otázek</span>
            <span className="pl-book__mark" aria-hidden="true">✦</span>
            <div>
              <div className="pl-book__title">Tvůj<br />příběh</div>
              <div className="pl-book__rule" />
              <div className="pl-book__sub">Kniha vzpomínek</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
