import { PRESS } from "../_data/media";
import { Placeholder } from "./Placeholder";

export function Press() {
  return (
    <section className="pl-press" aria-label="Psali o nás">
      <div className="pl-container">
        <p className="pl-press__label">Psali o nás</p>
        <div className="pl-press__track">
          {PRESS.map((logo, i) => (
            <Placeholder key={i} label={logo.label} showIcon={false} />
          ))}
        </div>
      </div>
    </section>
  );
}
