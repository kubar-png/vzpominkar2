import { Logo } from "@/components/brand/Logo";
import { BRAND, FOOTER_COLS, PAYMENTS, SOCIALS } from "../_data/site";
import { Icon } from "./Icon";

export function Footer() {
  return (
    <footer className="pl-footer">
      <div className="pl-container">
        <div className="pl-footer__grid">
          <div className="pl-footer__brand">
            <a className="pl-brand" href="#top" aria-label={`${BRAND.name} — domů`}>
              <Logo variant="full" tone="offwhite" height={30} />
            </a>
            <p>Vázané knihy plné otázek, ze kterých vznikají rodinné příběhy. Darujte vzpomínku, která zůstane.</p>
            <div className="pl-footer__social">
              {SOCIALS.map((s) => (
                <a key={s.label} href={s.href} aria-label={s.label}>
                  <Icon name={s.icon} size={19} />
                </a>
              ))}
            </div>
          </div>

          {FOOTER_COLS.map((col) => (
            <div className="pl-footer__col" key={col.title}>
              <h4>{col.title}</h4>
              <ul>
                {col.links.map((l) => (
                  <li key={l.label}><a href={l.href}>{l.label}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pl-footer__bar">
          <span>© 2026 {BRAND.name} · Tištěno a vázáno v České republice</span>
          <div className="pl-footer__pay" aria-label="Platební metody">
            {PAYMENTS.map((p) => (
              <span className="pl-paychip" key={p}>{p}</span>
            ))}
          </div>
          <div className="pl-footer__legal">
            <a href="#">Obchodní podmínky</a>
            <a href="#">Ochrana údajů</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
