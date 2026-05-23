# Product

## Register

product

## Users

**Primary: Owners** — Czech adults, typically 30–55, the children or grandchildren of the elderly relative whose stories the app is capturing. They invite a "blízký" (parent or grandparent), curate weekly questions, react to incoming voice/text/photo memories, and at the end of the year receive a hand-bound printed book. They do this from their phone in idle moments (commute, evening) and from a laptop when they sit down to plan. Their job is **not** producing memories themselves — it's lightly orchestrating, witnessing, and reacting. The interface must respect that they're tired, busy, and emotionally invested.

**Secondary: Seniors** — Czech adults 65+, often less tech-literate. They receive a weekly question via SMS, click a single link, and respond by voice (preferred), text, or photo. The senior surface lives in `(senior)` and is governed by its own AAA-contrast big-touch design system. **Out of scope for this brief** — the focus here is the owner app.

Owner context: someone glancing at their dashboard at 9pm to see if Mom answered this week's question. A weekly visit, sometimes daily. They want clarity ("what's new", "what's pending"), not a workspace.

## Product Purpose

Capture the memory of elderly family members week by week, turn it into a printed book, before it's too late. The owner app is the family's quiet control panel — see new memories, plan what to ask next, react with a heart, occasionally edit a transcript, eventually order the printed book.

Success = the owner opens the app weekly, feels light closure ("Mom answered, I read it, I left a heart"), and doesn't perceive friction in any step.

## Brand Personality

Warm, calm, editorial. Three words: **quiet, intentional, dignified**. Voice = vykání (formal Czech you), gentle pacing, never urgent. The brand draws from print magazines and bound books, not from tech-startup playbooks. Emotional goals: **trust** (this is family material), **calm** (no pressure to perform), **warmth** (this is love work).

## Anti-references

What the owner app explicitly should not feel like:

- **SaaS cliché dashboards** — the big-number-hero-metric template, gradient accents, "Welcome back, [Name]! Here's your weekly stats."
- **Linear copy-paste** — Linear is a reference for craft (dense, typographic), but its cool/professional energy is wrong; we're warmer. The chrome can be Linear, the voice must not be.
- **Notion's everything-is-a-database aesthetic** — toggles, properties, status pills, kanban views. We're not a workspace; we're a quiet feed.
- **Photo-album / scrapbook tropes** — paper textures, polaroid frames, handwritten Caveat font everywhere, decorative ornaments. Marketing has those moments; the app does not.
- **Healthcare app cleanliness** — sterile white, teal accents, geometric icons. Too clinical for love work.

## Design Principles

1. **One thing per page.** A page has one primary intent. Everything else is supporting context. If there are two equally-important actions, the page is wrong, not the design.
2. **The content is the interface.** Memory cards, transcripts, photos — these are the stars. UI chrome (filters, sorts, navigation) recedes to gray and lives outside the reading rhythm.
3. **Calm density.** Not sparse (we have real content), not dense (this isn't an admin tool). Generous whitespace inside cards, restrained whitespace between sections.
4. **Editorial typography over decorative chrome.** Pangaia + Inter + numerals do the work. Avoid icon bloat, badge collections, status pills as decoration.
5. **No italics.** A user-set constraint. Editorial emphasis happens via weight, color, or display serif — never via slant.

## Accessibility & Inclusion

WCAG AA. Standard owner-app accessibility — typical owner is 30–50 years old, not a senior. Minimum touch target 44×44px on mobile. Color contrast 4.5:1 for body text, 3:1 for large text and UI components. Keyboard navigation throughout. `prefers-reduced-motion` already wired globally; respected for all animations. No color-only state indication (also use icon or label).

The senior surface has its own AAA spec and is not covered here.

## Reference patterns (informative — not a license to clone)

- **Stripe Dashboard** — one clear primary action per page, structured-not-stuffed tables, refined neutrals, calm meta hierarchy. The "feels professional without trying hard" model.
- **Notion (reader, not editor)** — warm-but-precise typography, calm density, soft borders, generous reading-column widths. The "warm productivity" model.

The owner app should feel like Stripe's structure with Notion's warmth, under our editorial brand (cream + navy + gold + warm-brown, Pangaia + Inter).
