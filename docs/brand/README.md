# Vzpomínkář — vizuální identita

Zdroj: `Logomanual_VZPOMINKAR.pdf` (Google Drive, studiojakub.cz, verze 2, červen 2026).
Tagline: **Psáno i vyprávěno**

Na webu **vždy používej SVG** loga z `logo/`. Loga se nesmí deformovat, křivit ani otáčet,
nepoužívej barvy mimo manuál, drž ochrannou zónu (1/2 velikosti symbolu), logo usazuj k vrchní
části layoutu nebo do levého horního rohu. Na fotce nesmí být logo podloženo bílou/barevnou plochou.

---

## Barvy

Naředěné odstíny (70 % / 30 %) jsou v manuálu definované jako tisková procenta krycí barvy.
Pro web jsou níže **zploštěné přes bílou na solidní hex** (žádná průhlednost — tak jak chceš).

### Primární

| Barva | 100 % | 70 % | 30 % | CMYK |
|---|---|---|---|---|
| Námořnická modř | `#1B2E4D` | `#5F6D82` | `#BBC0CA` | 98 / 81 / 40 / 40 |
| Malinová růžová | `#CF364C` | `#DD7282` | `#F1C3C9` | 12 / 90 / 60 / 0 |
| Malinová — plochy | `#C33D50` | `#D57784` | `#EDC5CA` | 17 / 86 / 56 / 7 |

**Použití malinové:** tlačítka / CTA + akcenty (vč. loga) → **Malinová růžová `#CF364C`** (výraznější);
barevné plochy → **Malinová – plochy `#C33D50`**. Hover tlačítka používá plochovou `#C33D50`.

> **Pozor — dodaná loga mají jinou malinovou než manuál:** `logo*bez/symbol` = `#e6344c`,
> `logo*tagline` = `#d5364d`, swatch v manuálu = `#CF364C`. Na webu jsme logo sjednotili na
> manuálovou `#CF364C` (přebarvená kopie v mockupu); originály v `logo/` zůstávají jak přišly.
> **K vyřešení s grafikem:** re-export log v `#CF364C`, ať zdroj sedí s manuálem.

### Sekundární

| Barva | 100 % | 70 % | 30 % | CMYK |
|---|---|---|---|---|
| Off-White | `#FEF7D7` | `#FEF9E3` | `#FFFDF3` | 1 / 1 / 21 / 0 |

> **Pozn.:** samotné SVG logo je vyvedené v `#D5364D` — o chlup jasnější malinová než
> swatch `#CF364C` v manuálu. Při kombinaci logo + plochy na to pozor (drobný nesoulad).

Pokud bys přece jen chtěl naředění jako průhlednost (např. na fotce), odpovídá to
`rgba()` s alfou 0.70 / 0.30 dané základní barvy.

---

## Fonty

Obojí je **zdarma na Google Fonts**, takže pro web není potřeba nic stahovat — načítá se z CDN.
Soubory a odkazy ke stažení jsou v `fonts/`.

| Role | Font | Foundry | Google Fonts |
|---|---|---|---|
| Primární (nadpisy) | **Bree Serif** | TypeTogether | https://fonts.google.com/specimen/Bree+Serif |
| Sekundární (UI / text) | **Host Grotesk** | Element Type | https://fonts.google.com/specimen/Host+Grotesk |

- **Bree Serif** = přátelský slab serif. Pozor: free verze na Google Fonts má jen jeden řez
  (Regular 400). Plná rodina *Bree* (více řezů + vzpřímená kurzíva) je placená licence TypeTogether.
- **Host Grotesk** = uniwidth sans postavený na Poppins; variabilní, plný rozsah řezů.

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bree+Serif&family=Host+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

---

## Loga (`logo/`)

| Soubor | Co to je |
|---|---|
| `logo-malinova-tagline.svg` | plné logo, malinová, s taglinem |
| `logo-malinova.svg` | plné logo, malinová, bez taglinu |
| `symbol-malinova.svg` | jen symbol, malinová |
| `logo-offwhite-tagline.svg` | plné logo, off-white, s taglinem |
| `logo-offwhite.svg` | plné logo, off-white, bez taglinu |
| `symbol-offwhite.svg` | jen symbol, off-white |

Minimální tisková velikost: s taglinem 30 mm, bez taglinu 20 mm, symbol 20 mm.

Tokeny pro přímé použití v CSS jsou v `tokens.css`.
