import { REVIEWS } from "../_data/testimonials";
import { Icon } from "./Icon";
import { Placeholder } from "./Placeholder";

export function Testimonials() {
  return (
    <section className="pl-section" id="recenze">
      <div className="pl-container">
        <div className="pl-head pl-head--center" data-reveal>
          <h2>Co říkají rodiny, které knihu darovaly</h2>
        </div>
        <div className="pl-reviews">
          {REVIEWS.map((r, i) => (
            <figure className="pl-review" key={r.name} data-reveal {...{ [`data-reveal-delay-${((i % 3) + 1) * 100}`]: "" }}>
              <span className="pl-stars" aria-label={`Hodnocení ${r.rating} z 5`}>
                {Array.from({ length: r.rating }).map((_, s) => <Icon key={s} name="star" size={17} />)}
              </span>
              <blockquote className="pl-review__quote">„{r.quote}“</blockquote>
              <figcaption className="pl-review__who">
                <Placeholder label="" showIcon={false} />
                <span>
                  <span className="pl-review__name">{r.name}</span>
                  <br />
                  <span className="pl-review__role">{r.role}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
