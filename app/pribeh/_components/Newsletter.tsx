"use client";

import { useState } from "react";

export function Newsletter() {
  const [sent, setSent] = useState(false);

  return (
    <section className="pl-section">
      <div className="pl-container">
        <div className="pl-news" data-reveal data-reveal-variant="scale">
          <h2>Buďte u toho, než vyprodáme</h2>
          <p>Jednou za čas pošleme tip na darování, nové otázky do knihy a slevu pro odběratele jako první. Žádný spam.</p>

          {sent ? (
            <p className="pl-news__ok" role="status">Hotovo — díky! Ozveme se s první novinkou.</p>
          ) : (
            <form
              className="pl-news__form"
              onSubmit={(e) => { e.preventDefault(); setSent(true); }}
            >
              <label htmlFor="pl-news-email" className="sr-only" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
                E-mailová adresa
              </label>
              <input
                id="pl-news-email"
                type="email"
                required
                placeholder="vas@email.cz"
                autoComplete="email"
              />
              <button className="pl-btn pl-btn--dark" type="submit">Odebírat</button>
            </form>
          )}
          <p className="pl-news__fine">Přihlášením souhlasíte se zasíláním novinek. Odhlásit se můžete kdykoliv.</p>
        </div>
      </div>
    </section>
  );
}
