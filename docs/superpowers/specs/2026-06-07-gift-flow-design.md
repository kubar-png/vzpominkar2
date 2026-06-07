# Real gift flow from /darek — design spec

**Date:** 2026-06-07 · **Branch:** `feat/gift-flow`
**Goal:** Replace the broken `/darek` CTA (→ `/signup?gift=1`, which just bounces logged-in users to /dashboard and ignores `gift`) with a real gift flow: choose a product → personalize a printable gift voucher → pay as fast as possible. Two payment paths depending on the product (book = guest checkout, app = account). Captures last-minute buyers (Vánoce/Štědrý den) who just need a voucher to print.

Owner requirements (2026-06-07), verbatim intent:
- CTA "Darovat Vzpomínkář" → an onboarding-like sequence. **Step 1 = pick the product** on **three cards**.
- **Middle card = the primary product (app access + printed book, 2 890 Kč)** — visually highlighted, slightly bigger, on the light-navy (`#0e3b64`) card, with its benefits listed, to steer people to it.
- Left/right cards = the two gift books: **standard fill-in book (pre-filled questions, 599 Kč)** and **custom book (write your own questions, 899 Kč)**.
- After choosing → pay ASAP. Plus a **gift voucher (dárkový poukaz) configurator** — A5 landscape, color choice, text "Zajímá mě tvůj příběh. / Proto jsem ti koupil Vzpomínkář." downloadable as PDF — so last-minute buyers can print the voucher even if the book won't arrive / the app isn't set up yet.
- **Login branching:** the book products need NO login (guest checkout exists); the app product needs an account. Branch the flow on the choice.

## Resolved design decisions (defaults — flag if the owner wants otherwise)
1. **App-gift = the existing owner model.** Gifting the app = the buyer is the family owner and sets it up for the recipient (the senior/storyteller) — exactly today's signup → onboarding → `book_base` payment. No new "recipient redeems a code" mechanic (that would be a much bigger build). The voucher is the physical card the buyer hands over. *(If the owner wants recipient-redeems-a-code instead, that's a separate, larger feature — flag it.)*
2. **Voucher is shared across all three products** — it's the gift artifact. Configured in the flow; the **PDF is downloadable on the post-payment confirmation page + emailed** (so last-minute buyers print immediately after paying). Not downloadable before payment (no free vouchers).
3. **Voucher PDF** = reuse the existing Puppeteer + `@sparticuz/chromium` print pipeline (`app/api/print/book`, `app/print/book/[token]`, `lib/print/token.ts`). New A5-landscape print route `/print/voucher/[token]` + render API. HMAC-signed token like the book.
4. **Voucher A5 landscape**, brand cover colors (reuse `lib/book/cover.ts` palette: brown/navy/red/gold), the two-line message (gender-aware via `lib/gender.ts`: "koupil{a}").
5. Routing entry: new **`/darovat`** page (the 3-card chooser). `/darek` CTAs ("Darovat Vzpomínkář") repoint from `/signup?gift=1` → `/darovat`.

## Flow
```
/darek  ── CTA "Darovat Vzpomínkář" ──▶  /darovat  (Krok 1: 3-card product chooser)
                                              │
        ┌─────────────────────────────────────┼─────────────────────────────────────┐
   [Standard book 599]                   [APP 2 890 — highlighted]               [Custom book 899]
        │ guest, no login                      │ needs account                        │ guest, no login
        ▼                                       ▼                                       ▼
   /kniha/objednat (existing)            signup → onboarding (existing)          /kniha/sestavit (existing configurator)
        │  + voucher step                      │  + voucher step                       │  + voucher step
        ▼                                       ▼                                       ▼
   guest checkout (shop_orders)          /onboarding/platba (book_base)          guest checkout (shop_orders)
        │                                       │                                       │
        └───────────────▶  PAY  ◀──────────────┴───────────────▶  PAY  ◀────────────────┘
                                              │
                                   Confirmation page: download voucher PDF + emailed
```

## What to build (NEW)
- **`app/darovat/page.tsx`** — Krok-1 chooser. 3 cards (`GiftProductCard`): middle = app (light-navy `#0e3b64`, larger via grid/scale, "Doporučeno" chip, benefit bullets: online knihovna, hlas u každé kapitoly, tištěná kniha v ceně, napořád…); sides = standard 599 / custom 899 (concise). Each card CTA routes to the right next step with a `gift=1` (+ chosen product) marker. Prices from env via `lib/stripe/server.ts` (display floors honest). Reuse the brand editorial styles; mobile = stacked, app card first.
- **Voucher configurator** — a step (component) where the buyer picks a color (reuse `CoverBg`/cover palette) and sees a live A5-landscape preview of the voucher with the two-line message; optional recipient oslovení + buyer signature. Stored on the order (see migration).
- **Voucher PDF** — `app/print/voucher/[token]/page.tsx` (A5 landscape HTML, brand colors, the message) + `app/api/print/voucher/route.ts` (Puppeteer render, HMAC token via `lib/print/token.ts`). Linked from the confirmation page (download) + attached/linked in the confirmation email.
- **Routing/threading glue** — `/darek` CTA → `/darovat`; chooser → existing flows carrying the product + voucher config; confirmation surfaces the voucher download. For the app path, `lib/auth/actions.ts` should honor `gift=1` (route through the same onboarding, mark the order/family as a gift, attach the voucher).
- **Migration (write file only, do NOT apply)** — store voucher config: add to `shop_orders` (and the book order path) columns like `gift_voucher` jsonb (or `voucher_color`, `voucher_message`, `voucher_recipient`, `voucher_signed`) + a `is_gift boolean`. Hand-edit `types/database.ts`. Owner applies to prod later.

## Reuse (do NOT rebuild)
- Standard gift checkout: `app/kniha/objednat/*` + `lib/shop/order-actions.ts` (guest `shop_orders`).
- Custom gift configurator: `app/kniha/sestavit/*` (question picker, cover, drag-reorder).
- Gift question library: `lib/book-shop/phases.ts`.
- App purchase: signup (`app/(auth)/signup`), onboarding (`app/onboarding/*`), `lib/stripe/checkout.ts` (`book_base`), `/onboarding/platba`.
- PDF: `app/api/print/book`, `app/print/book/[token]`, `lib/print/token.ts`, `@sparticuz/chromium` (Node runtime).
- Cover colors: `lib/book/cover.ts`. Gender tokens: `lib/gender.ts`. Money: `formatCzk` (`lib/utils`).

## Honesty / brand rules (hard)
- No fake urgency; no money-back guarantee. Voucher + last-minute framing is honest expectation-setting, not scarcity.
- Only promise what ships. The voucher is a printable card; for the app it says "I set up Vzpomínkář for you," for the book "your book is on its way (3–4 weeks)."
- Price shown = price charged (the free-path / env price discipline still applies).

## Out of scope (later)
- Recipient-redeems-a-code app gifting (this spec = buyer sets up the app, voucher is a card).
- Scheduled send-date / SMS delivery of the voucher (download + email only for now).
