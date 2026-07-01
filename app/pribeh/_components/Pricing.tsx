import { BUNDLES } from "../_data/bundles";
import { Icon } from "./Icon";

export function Pricing() {
  return (
    <section className="pl-section" id="balicky">
      <div className="pl-container">
        <div className="pl-head pl-head--center" data-reveal>
          <h2>Vyberte, kolik knih chcete darovat</h2>
          <p className="pl-lede">Jednorázová platba, dárková krabička v ceně. Žádné předplatné, žádné účty.</p>
        </div>

        <div className="pl-plans">
          {BUNDLES.map((b, i) => (
            <div
              className={`pl-plan${b.featured ? " pl-plan--featured" : ""}`}
              key={b.id}
              data-reveal
              {...{ [`data-reveal-delay-${(i + 1) * 100}`]: "" }}
            >
              {b.badge && <span className="pl-plan__badge">{b.badge}</span>}
              <div className="pl-plan__qty">{b.name}</div>
              <p className="pl-plan__desc">{b.desc}</p>

              <div className="pl-plan__free">v testovací verzi zdarma</div>

              <ul>
                {b.perks
                  .filter((p) => !/Kč|Ušetříte/.test(p))
                  .map((p) => (
                    <li key={p}><Icon name="check" size={17} />{p}</li>
                  ))}
              </ul>

              <a
                className={`pl-btn pl-plan__cta pl-btn--block ${b.featured ? "pl-btn--primary" : "pl-btn--ghost"}`}
                href="#"
              >
                {b.cta}
              </a>
            </div>
          ))}
        </div>

        <p className="pl-pricing__note">
          Doprava zdarma po celé ČR
          <span className="sep">·</span> Tištěno a vázáno v ČR
          <span className="sep">·</span> Platba kartou, Apple Pay i převodem
        </p>
      </div>
    </section>
  );
}
