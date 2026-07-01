import { STEPS } from "../_data/benefits";
import { Icon } from "./Icon";

export function HowItWorks() {
  return (
    <section className="pl-section pl-section--warm" id="jak">
      <div className="pl-container">
        <div className="pl-head pl-head--center" data-reveal>
          <h2>Od dárku k rodinnému pokladu ve čtyřech krocích</h2>
          <p className="pl-lede">Žádná technika, žádné přihlašování. Stačí předat knihu — o zbytek se postará sám příběh.</p>
        </div>
        <div className="pl-steps">
          {STEPS.map((s, i) => (
            <div
              className="pl-step"
              key={s.n}
              data-reveal
              data-reveal-variant="scale"
              {...{ [`data-reveal-delay-${(i + 1) * 100}`]: "" }}
            >
              <span className="pl-step__num" aria-hidden="true">{s.n}</span>
              <span className="pl-step__icon"><Icon name={s.icon as never} size={26} /></span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
