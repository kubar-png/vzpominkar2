"use client";

import { useEffect, useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { BRAND, NAV_LINKS } from "../_data/site";
import { Icon } from "./Icon";

export function Nav() {
  const [open, setOpen] = useState(false);

  // Lock body scroll while the mobile menu is open.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <header className="pl-nav">
      <nav className="pl-container pl-nav__inner" aria-label="Hlavní">
        <a className="pl-brand" href="#top" aria-label={`${BRAND.name} — domů`}>
          <Logo variant="full" tone="raspberry" height={30} />
        </a>

        <div className="pl-menu">
          {NAV_LINKS.map((l) => (
            <a key={l.label} href={l.href}>{l.label}</a>
          ))}
        </div>

        <div className="pl-nav__actions">
          <button className="pl-iconbtn" type="button" aria-label="Účet">
            <Icon name="user" size={21} />
          </button>
          <button className="pl-iconbtn" type="button" aria-label="Košík (2 položky)">
            <Icon name="cart" size={21} />
            <span className="pl-cart-count" aria-hidden="true">2</span>
          </button>
          <a className="pl-btn pl-btn--primary pl-btn--sm pl-nav__cta" href="#balicky">Koupit knihu</a>
          <button
            className="pl-iconbtn pl-burger"
            type="button"
            aria-label="Otevřít menu"
            aria-expanded={open}
            onClick={() => setOpen(true)}
          >
            <Icon name="menu" size={24} />
          </button>
        </div>
      </nav>

      <div className="pl-mobile" hidden={!open}>
        <div className="pl-container">
          <div className="pl-mobile__top">
            <a className="pl-brand" href="#top" aria-label={`${BRAND.name} — domů`} onClick={() => setOpen(false)}>
              <Logo variant="full" tone="raspberry" height={28} />
            </a>
            <button className="pl-iconbtn" type="button" aria-label="Zavřít menu" onClick={() => setOpen(false)}>
              <Icon name="close" size={24} />
            </button>
          </div>
          <div className="pl-mobile__links">
            {NAV_LINKS.map((l) => (
              <a key={l.label} href={l.href} onClick={() => setOpen(false)}>{l.label}</a>
            ))}
          </div>
          <a className="pl-btn pl-btn--primary pl-btn--block" href="#balicky" onClick={() => setOpen(false)}>
            Koupit knihu
          </a>
        </div>
      </div>
    </header>
  );
}
