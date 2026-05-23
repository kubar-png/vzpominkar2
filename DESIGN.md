---
name: Vzpomínkář — Owner App
description: Calm, editorial product surface for capturing family memories week by week
colors:
  page-bg: "#f4ebd6"
  surface: "#ffffff"
  surface-alt: "#fbf5e3"
  surface-muted: "#ede4cf"
  border: "#e8dec3"
  border-strong: "#d8c69e"
  ink: "#0e3b64"
  ink-strong: "#08233d"
  ink-soft: "#445d77"
  ink-muted: "#7a8a99"
  ink-subtle: "#a3afba"
  ink-on-dark: "#fbf5e3"
  gold: "#d4a017"
  gold-soft: "#e8c66a"
  oxblood: "#a8231f"
  oxblood-deep: "#7a1814"
  warm-brown: "#1c1814"
  warm-brown-soft: "#2d2620"
  success: "#236c4a"
  warning: "#9b6b18"
  danger: "#a8231f"
  focus-ring: "#d4a017"
typography:
  page-title:
    fontFamily: "PP Pangaia, Georgia, serif"
    fontSize: "32px"
    fontWeight: 500
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  section-heading:
    fontFamily: "PP Pangaia, Georgia, serif"
    fontSize: "22px"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  card-title:
    fontFamily: "Inter, -apple-system, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "normal"
  body:
    fontFamily: "Inter, -apple-system, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  body-small:
    fontFamily: "Inter, -apple-system, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  meta:
    fontFamily: "Instrument Sans, Inter, sans-serif"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "0.08em"
  numeral:
    fontFamily: "Inter, sans-serif"
    fontSize: "14px"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "normal"
rounded:
  sm: "4px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  2xl: "32px"
  3xl: "48px"
components:
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "{spacing.xl}"
  card-muted:
    backgroundColor: "{colors.surface-alt}"
    rounded: "{rounded.lg}"
    padding: "{spacing.xl}"
  button-primary:
    backgroundColor: "{colors.gold}"
    textColor: "{colors.ink-strong}"
    rounded: "{rounded.pill}"
    padding: "10px 22px"
  button-primary-hover:
    backgroundColor: "{colors.gold-soft}"
    textColor: "{colors.ink-strong}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "10px 22px"
  button-secondary-hover:
    backgroundColor: "{colors.surface-alt}"
    textColor: "{colors.ink-strong}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-soft}"
    padding: "8px 14px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-strong}"
    rounded: "{rounded.md}"
    padding: "10px 14px"
  filter-pill:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.pill}"
    padding: "8px 14px"
  filter-pill-active:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.ink-on-dark}"
    rounded: "{rounded.pill}"
    padding: "8px 14px"
  meta-label:
    textColor: "{colors.ink-muted}"
    typography: "{typography.meta}"
---

## Overview

The owner-app surface is the quiet control panel of Vzpomínkář — where family members curate weekly questions, read incoming memories, and manage the people in their family. It sits behind authentication, separate from the marketing brand surface (which has its own editorial design language under the `.editorial` CSS scope).

Two design constants govern this surface:

1. **The content is the interface.** Memory cards, transcripts, photos, audio waveforms — these are the stars. UI chrome (filters, sorts, navigation) recedes to muted neutrals and lives outside the reading rhythm.
2. **Owner traffic is low-frequency, high-emotion.** The owner opens this app a few times a week, often at 9pm with a baby on the couch, sometimes excited (a new memory came in), sometimes tired. The surface must feel calm in both moods.

Stripe Dashboard provides our structural reference (one primary action per page, refined neutrals, clear hierarchy). Notion's reader mode provides our warmth reference (generous reading-column widths, soft borders, warm typography). The brand layer (Pangaia + Inter + cream/navy/gold) is uniquely ours.

## Colors

The owner app is **restrained**: cream-paper page background, white cards lifted with hairline borders, navy ink for text, gold for primary actions and current selection only. Warm-brown (`#1c1814`) carries the sidebar — a deep, low-chroma neutral that frames the workspace without competing for attention.

- **`page-bg` (#f4ebd6)** — the always-on canvas of the content area. Tinted cream, never `#fff`.
- **`surface` (#ffffff)** — pure white for elevated cards and inputs. Used sparingly so it reads as elevation, not as default ground. Cards always sit on `page-bg`, never on each other.
- **`surface-alt` (#fbf5e3)** — softer cream variant for nested or de-emphasized surfaces (filter bar background, secondary panels).
- **`border` (#e8dec3)** — hairline 1px border on cards, inputs, dividers. The default separator.
- **`ink` (#0e3b64)** — navy primary text and headings on light surfaces.
- **`ink-soft` / `ink-muted` / `ink-subtle`** — a four-step ink ramp for body, meta, and disabled states. Use the lightest step (`ink-subtle`) only for true tertiary information.
- **`gold` (#d4a017)** — primary action only (one per page), current navigation selection, important state indicators. Never decoration.
- **`oxblood` (#a8231f)** — destructive action confirmation, error states. Used minimally.
- **`warm-brown` (#1c1814)** — sidebar background. Frames the workspace, never bleeds into content.
- **Semantic state colors** (`success`, `warning`, `danger`) — for state-bearing UI only (badges, validation), not for emphasis.

Never `#000` or `#fff` — every neutral is tinted toward the brand hue.

## Typography

One family carries 95% of the surface: **Inter** (loaded via `next/font/google` as `--font-sans`). It serves headings (≥ section-heading), card titles, body, labels, buttons, data. **PP Pangaia** is reserved for **page titles only** — the H1 of each page is the editorial moment that quietly signals "you're in Vzpomínkář, not Stripe."

The scale is **fixed rem** (not fluid), 1.2 ratio between most steps. Product UIs are viewed at consistent DPI; clamp-sized headings shrink awkwardly inside sidebars and panels.

- **`page-title`** — Pangaia 32px / 500 / line-height 1.1 / tracking -0.02em. One per page (the H1 in the page header).
- **`section-heading`** — Pangaia 22px / 500. Used sparingly for distinct content groups within a page.
- **`card-title`** — Inter 17px / 600. Memory titles, card headers.
- **`body`** — Inter 15px / 1.6. Default text.
- **`body-small`** — Inter 13px / 1.5. Card descriptions, supporting text.
- **`meta`** — Instrument Sans 12px / 500 / **UPPERCASE** / tracking 0.08em. Eyebrows, labels, timestamps.
- **`numeral`** — Inter 14px / 500 with `tabular-nums`. Counts, prices, durations.

**No italics anywhere.** Emphasis uses weight (Inter 600), color (`ink-strong` vs `ink-muted`), or display serif (Pangaia for headings). The italic ban is an explicit project constraint.

Reading prose (memory transcripts) caps at 65ch. Compact UI rows and tables run denser.

## Elevation

The owner app uses **two elevation levels**, both subtle:

- **Level 0 — ground.** Page-bg cream, no shadow. Everything starts here.
- **Level 1 — card.** White surface, hairline border (`border`), no plate shadow by default. On hover for clickable cards: `0 8px 24px -16px rgba(8, 35, 61, 0.10)` — a soft warm shadow that suggests lift without darkening the surface.

True overlays (modals, popovers, dropdowns) use a heavier shadow tier introduced ad-hoc when needed; they are rare in this surface (we prefer inline reveal and progressive disclosure).

**No plate-flat shadows by default.** Cards earn shadow on interaction, not as decoration.

## Components

Every interactive component implements: default, hover, focus (visible ring), active, disabled. Where relevant: loading, error.

**Cards.** White surface, hairline border, 16–24px padding. Three internal zones separated by whitespace (12–16px), never by dividing lines:
- *Header* — meta row (date · author) + utility icons (favorite, kebab)
- *Body* — primary content (title + text/audio/photos)
- *Footer* — single navigation arrow or CTA

Cards on the page sit in a single-column or 2-column grid with 16–20px gap. Cards do **not** nest.

**Buttons.** One primary CTA per page (gold pill, navy text, `↗` arrow after label). Secondary actions become white pill with hairline (`button-secondary`) or ghost text-link with arrow. Destructive actions are oxblood text on white, never oxblood fill. All buttons share the same height (40px), the same pill rounding, the same 200ms hover transition.

**Inputs.** White surface, hairline border, focus ring (2px `gold` with 1px offset). Search inputs have a left-aligned magnifier icon at 14px. Selects share the same shape as inputs.

**Filter pills.** Default = white pill with hairline + muted ink. Active = navy fill + cream text. Used for facet filters (per-senior, favorites) and view switches. Sort uses a real select (a pill that opens a dropdown is too clever).

**Sidebar.** Warm-brown background (`warm-brown`), 280px wide, generous item padding (14px y, 16px x), 17px label, Roman numerals as section anchors. Already existing and explicitly kept.

**Empty states.** Always teach the interface, never "nothing here." Small lucide icon (no emojis), warm 1–2 sentence message, clear primary CTA. Centered in a white card on page-bg.

**Loading.** Skeleton placeholders (already exist for route segments), no spinners in the middle of content.

## Do's and Don'ts

**Do**
- Use Pangaia only for page-title H1. Every other text is Inter.
- Give every page one primary action. If there are two, the page is wrong.
- Treat memory content as the star; chrome (filters, sorts) recedes.
- Cards on page-bg, never nested. Generous whitespace inside, restrained between.
- Use `tabular-nums` on counts, durations, dates.
- Render destructive actions as oxblood **text** on white, never oxblood fill.
- Honor `prefers-reduced-motion`; cap hover transitions at 200ms.

**Don't**
- Use italics anywhere. Emphasize with weight, color, or serif (Pangaia for headings only).
- Use `#000` or `#fff` raw — pull from the neutrals scale.
- Use Pangaia for body, labels, or buttons. It's a display serif; UI labels in display fonts misread at small sizes.
- Ship status pills ("Hotovo", "Koncept") as decoration. State pills exist only when state changes user behavior.
- Use shadow as default; shadow signals lift on interaction.
- Reinvent standard affordances. Save / Cancel buttons, search input, breadcrumb, kebab menu — keep their familiar shape.
- Animate layout properties (height, width, top, left). Use `transform` + `opacity` only.
- Use emojis as icons. Lucide icons (or Roman numerals) only.
- Decorate with gradient text, hero metrics, or identical card grids — those are SaaS-cliché reflexes.
