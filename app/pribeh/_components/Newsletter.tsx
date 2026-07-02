"use client";

import { useState } from "react";

export function Newsletter() {
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = new FormData(e.currentTarget).get("email");
    if (typeof email !== "string" || !email) return;
    setBusy(true);
    setError(false);
    try {
      // "Přihlášením souhlasíte…" below is the explicit consent the endpoint requires.
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, consent: true }),
      });
      if (res.ok || res.redirected) setSent(true);
      else setError(true);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="pl-section">
      <div className="pl-container">
        <div className="pl-news" data-reveal data-reveal-variant="scale">
          <h2>Buďte u toho, než vyprodáme</h2>
          <p>Jednou za čas pošleme tip na darování, nové otázky do knihy a slevu pro odběratele jako první. Žádný spam.</p>

          {sent ? (
            <p className="pl-news__ok" role="status">Hotovo — díky! Ozveme se s první novinkou.</p>
          ) : (
            <form className="pl-news__form" onSubmit={onSubmit}>
              <label htmlFor="pl-news-email" className="sr-only" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
                E-mailová adresa
              </label>
              <input
                id="pl-news-email"
                name="email"
                type="email"
                required
                placeholder="vas@email.cz"
                autoComplete="email"
              />
              <button className="pl-btn pl-btn--dark" type="submit" disabled={busy}>
                {busy ? "Odesílám…" : "Odebírat"}
              </button>
            </form>
          )}
          {error ? (
            <p className="pl-news__fine" role="alert">Přihlášení se nezdařilo. Zkuste to prosím znovu.</p>
          ) : null}
          <p className="pl-news__fine">Přihlášením souhlasíte se zasíláním novinek. Odhlásit se můžete kdykoliv.</p>
        </div>
      </div>
    </section>
  );
}
