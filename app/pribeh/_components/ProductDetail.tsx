import { CHAPTERS, FEATURES, SAMPLE } from "../_data/product";
import { Placeholder } from "./Placeholder";

function Media({ variant, label, dim }: { variant?: string; label?: string; dim?: string }) {
  if (variant === "sample") {
    return (
      <div className="pl-sample" aria-label="Ukázková otázka z knihy">
        <div className="pl-sample__chap">{SAMPLE.chapter}</div>
        <div className="pl-sample__q">{SAMPLE.q}</div>
        <div className="pl-sample__a">{SAMPLE.a}</div>
      </div>
    );
  }
  return <Placeholder label={label ?? "Foto produktu"} dim={dim} />;
}

export function ProductDetail() {
  return (
    <section className="pl-section pl-section--paper" id="detail">
      <div className="pl-container">
        <div className="pl-head pl-head--center" data-reveal>
          <h2>Promyšlená do posledního detailu</h2>
        </div>

        <div style={{ marginTop: "clamp(40px, 6vw, 72px)" }}>
          {FEATURES.map((f) => (
            <div className={`pl-feature${f.reverse ? " pl-feature--reverse" : ""}`} key={f.title} data-reveal>
              <div className="pl-feature__media">
                <Media variant={f.variant} label={f.mediaLabel} dim={f.mediaDim} />
              </div>
              <div className="pl-feature__body">
                <h3>{f.title}</h3>
                <p>{f.body}</p>
                {f.variant === "chapters" && (
                  <div className="pl-feature__chips">
                    {CHAPTERS.map((c, i) => (
                      <span className="pl-chip" key={c}><i>{i + 1}</i>{c}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
