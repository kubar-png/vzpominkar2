import { FAQ } from "../_data/faq";
import { Icon } from "./Icon";

export function Faq() {
  return (
    <section className="pl-section pl-section--paper" id="faq">
      <div className="pl-container">
        <div className="pl-head pl-head--center" data-reveal>
          <h2>Na co se ptáte nejčastěji</h2>
        </div>
        <div className="pl-faq" data-reveal>
          {FAQ.map((item) => (
            <details key={item.q}>
              <summary>
                {item.q}
                <span className="pl-faq__ico" aria-hidden="true"><Icon name="plus" size={14} /></span>
              </summary>
              <div className="pl-faq__a">{item.a}</div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
