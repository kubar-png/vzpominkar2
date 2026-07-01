import { USE_CASES } from "../_data/useCases";
import { Icon } from "./Icon";

export function UseCases() {
  return (
    <section className="pl-section pl-section--warm">
      <div className="pl-container">
        <div className="pl-head pl-head--center" data-reveal>
          <h2>Příležitost, která si o knihu říká</h2>
        </div>
        <div className="pl-cases">
          {USE_CASES.map((c, i) => (
            <article className="pl-case" key={c.title} data-reveal {...{ [`data-reveal-delay-${(i + 1) * 100}`]: "" }}>
              <span className="pl-case__icon" aria-hidden="true"><Icon name={c.icon as never} size={26} /></span>
              <h3>{c.title}</h3>
              <p>{c.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
