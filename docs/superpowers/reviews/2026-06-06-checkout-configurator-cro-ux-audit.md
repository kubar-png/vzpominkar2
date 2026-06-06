# Checkout & Configurator — CRO + UX Audit

**Date:** 2026-06-06
**Scope:** Purchase funnel — landing (`/`, `/cenik`, `/darek`, `/kniha`) → gift configurator (`/kniha/sestavit`) → checkouts (gift standard, gift custom, main product `/onboarding/platba`) → success.
**Lenses synthesized (6):** checkout/funnel friction · configurator UX · trust & conversion psychology · visual polish · copy & clarity · mobile & accessibility.
**Audience assumption throughout:** cold, low-intent, mobile-dominant paid-Meta traffic.

---

## Executive summary

The funnel has a genuinely strong editorial foundation: a consistent warm vykání voice, no fake urgency, no fabricated money-back guarantee, value-dense bullets, and two gift checkouts that are real single-screen guest checkouts with live totals. The recently-redesigned standard checkout (`/kniha/objednat`) and the main payment card (`/onboarding/platba`) are close to best-in-class on desktop.

The problems are **clarity, mobile fidelity, honesty alignment, and three broken handoffs** — not tone and not a redesign. Three findings are outright promise/price/product mismatches that will overcharge or mislead a cold buyer, and the heaviest-traffic mobile surfaces (homepage, configurator) carry the worst leaks.

### Highest-leverage wins (do these first)
1. **`/darek` sells a gift mechanism the funnel never delivers** (certificate, chosen send-date, SMS, PDF) — it routes to the ordinary main-product signup and silently drops `gift=1`. Confirmed: `lib/auth/actions.ts:94` unconditionally `redirect("/onboarding")` with no read of the flag. This is a direct refund/complaint generator. **Fix copy now (S), build the gift branch next (L).**
2. **`/cenik` price-trap:** line 42 says "hnědá a zlatá je v ceně," but code charges +99 Kč for a gold background (`isPremiumCover = bg !== "brown"`, `lib/book/cover.ts:41`). A buyer who picks gold on the strength of `/cenik` is overcharged at checkout. **One-line copy fix (S).**
3. **`/kniha` sticky mobile CTA pushes the WRONG product:** `Shell` renders a bare `<PrimaryCta />` (defaults to `/signup`, the 2 890 Kč main app) on the 599/899 Kč gift page (`Shell.tsx:53`). Cold mobile gift shoppers get a persistent bottom bar into the wrong, pricier funnel. **Small prop change (S).**
4. **Configurator reorder is dead on touch** — HTML5 `draggable` armed by `onMouseDown`; no touch/pointer path. On mobile-dominant traffic the grip is a premium-looking control that does nothing on a 899 Kč product. **Add ▲▼ buttons (M).**
5. **Reassurance is absent at the point of pay.** With no money-back guarantee by design, the honest substitutes (human support, "kniha/přístup je váš napořád," print-in-price, 3–4 week delivery) all live on marketing pages or post-purchase — never under the buy button. **Copy adds to existing arrays (S).**

### Counts by priority
- **P0 (do first): 4** — gift-promise mismatch, cover price-trap, sticky-CTA-wrong-product, configurator touch reorder.
- **P1: 11** — cancel handoff, forced account-before-price, reassurance stack, tisk-v-ceně at pay, free-path CTA label, homepage sticky CTA, homepage hero overflow, configurator first-run clarity, gender default, configurator mobile layout (top bar + pool-buries-book), sub-44px tap targets.
- **P2: 14** — orphaned credentials step, email-confirm guardrail, hero CTA tier weighting, configurator "6-phase slog" framing, price-config launch hygiene, CTA verb unification, radius/swatch polish, thin confirmation page, name collision, signup payment legibility, recap alignment, two-checkout divergence, textarea auto-grow, ARIA grouping.

Net: the funnel is **launch-blocked by honesty/price/product-routing bugs (the four P0s), not by structure.** Most fixes are copy or small props; the two larger ones (gift branch, account-before-price reorder) are the only L-effort items.

---

## Prioritized plan (de-duplicated across lenses)

### P0 — biggest conversion/UX/trust leaks, do first

**P0-1 · `/darek` gift promise vs delivery mismatch**
- **Surface/files:** `app/darek/page.tsx` → `app/(auth)/signup/page.tsx` + `signup-form.tsx` → `app/onboarding/page.tsx` → `app/onboarding/platba/page.tsx`; `lib/auth/actions.ts`.
- **Problem:** `/darek` promises a printed certificate on handmade paper in 3 working days, a buyer-chosen send-date ("první otázka odejde v pondělí"), SMS-or-email first-question delivery, a printed dedication, and a downloadable PDF. The CTA goes to `/signup?gift=1`; `gift` is captured into a hidden field + badge and then ignored — `signUpOwner` never reads it and `lib/auth/actions.ts:94` always `redirect("/onboarding")`. The next screens collect only name/email/password then the senior's display name then payment. None of the promised gift mechanics exist. (Merged: `T1-darek-promise-delivery-mismatch`, `gift-flow-promise-broken`.)
- **Change:** Fix in the honest direction. **Now (S):** rewrite `/darek` copy to what actually ships (drop chosen-date + SMS + 3-day certificate claims; describe the real flow and, if true, a downloadable PDF certificate), and correct the signup badge to set real expectations. **Next (L):** build a real gift branch — when `gift=1`, after signup route to a gift step that collects recipient oslovení, optional dedication, and a send-date, then generate the certificate the page already previews. Do not ship a Buy button whose landing page promises a date picker + certificate the next 3 screens never deliver.
- **Effort:** S (copy) now, **L** (full branch) later. **Impact:** high.

**P0-2 · `/cenik` gold-cover price-trap**
- **Surface/files:** `app/cenik/page.tsx:42` vs `lib/book/cover.ts:31,41`; contradicted correctly by `app/kniha/objednat/standard-order.tsx`.
- **Problem:** `/cenik` add-on row reads `"Jiná barva přebalu (hnědá a zlatá je v ceně)"`, but `DEFAULT_COVER_BG = "brown"` and `isPremiumCover(bg) = bg !== "brown"`, so a gold background is +99 Kč. The standard checkout already says "hnědá v ceně · ostatní +99 Kč" — so the pricing page contradicts the checkout. The gold the homepage shows is the *stamping/text* (free); the gold *background* is not. (Confirmed in code.)
- **Change:** Edit `/cenik:42` to `"Jiná barva desek — hnědá v ceně, ostatní +99 Kč"` (or `"Jiná barva přebalu (hnědá je v ceně)"`). Pure copy. (If product wants gold-bg free, change the code instead — copy fix is cheaper.)
- **Effort:** S. **Impact:** high (removes an overcharge + trust break).

**P0-3 · `/kniha` sticky mobile CTA advertises the wrong (pricier) product**
- **Surface/files:** `components/landing/Shell.tsx:34,51-57` + `app/kniha/page.tsx` (`<Shell>` with default `stickyMobileCta`).
- **Problem:** `Shell`'s sticky bar renders a bare `<PrimaryCta />` (default href `/signup`, label "Založit Vzpomínkář" — the 2 890 Kč main app). On `/kniha` (599/899 Kč gift) that bar persistently pushes mobile shoppers into the wrong, far more expensive funnel. (Confirmed: `Shell.tsx:53`.)
- **Change:** Add `stickyCtaHref` / `stickyCtaLabel` props to `Shell` (or accept a ReactNode); on `/kniha` pass `href="/kniha/objednat"` label "Objednat knihu". Minimum acceptable: `stickyMobileCta={false}` on `/kniha`. Audit `/darek` similarly.
- **Effort:** S. **Impact:** high.

**P0-4 · Configurator reorder is non-functional on touch**
- **Surface/files:** `app/kniha/sestavit/configurator.tsx` (~L445–486 drag handlers, grip `onMouseDown`/`onMouseUp`); `globals.css` `.kc-book-grip`.
- **Problem:** Reorder is the only ordering mechanism and relies on HTML5 `draggable={armedId===q.id}` armed by mouse-only events. Touch fires `touchstart`/`touchend`, never the mouse events, and native DnD is unreliable in mobile Safari/Chrome — so on the primary device the grip is a dead, premium-looking affordance on a 899 Kč product. Question order is a printed, durable property of the gift. (Merged: `cfg-2`, `configurator-reorder-desktop-only`, `cfg-drag-touch-broken`.)
- **Change:** Add always-available ▲▼ chevron buttons per book card (44px hit area) calling a `moveBy(id, ±1)` helper — works one-handed, discoverable. Keep drag as a desktop enhancement but move it to Pointer Events; or hide the grip on coarse pointers if reorder is deferred (`@media (pointer:coarse){.kc-book-grip{display:none}}`) so no dead affordance remains.
- **Effort:** M. **Impact:** high.

### P1 — strong conversion/UX gains

**P1-1 · Configurator → Stripe cancel handoff is silent (looks like the order vanished)**
- **Files:** `lib/shop/order-actions.ts:210` (`cancel_url: .../kniha/sestavit?cancelled=1`), `app/kniha/sestavit/page.tsx`, `configurator.tsx`. Standard checkout has the same gap minus the param.
- **Problem:** On Stripe abandonment the buyer returns to `?cancelled=1`, but neither the wrapper nor the Configurator reads it. The localStorage draft survives, but nothing says so — it reads as "my order disappeared." `/onboarding/platba` already does this correctly with a calm "kniha na vás počká" banner.
- **Change:** Mirror the platba pattern: `sestavit/page.tsx` reads `searchParams`, passes a `cancelled` prop, and on `cancelled=1` jumps straight to the recap step with a calm banner ("Platbu jste nedokončili — vaše rozpracovaná kniha je uložená") and the gold "Pokračovat k objednávce" pre-opened. Set an explicit `cancel_url` back to `/kniha/objednat` for the standard checkout with a restored-form banner. (F1.)
- **Effort:** M. **Impact:** high.

**P1-2 · Main product forces account creation before price/offer is ever shown**
- **Files:** `app/(auth)/signup/*` → `app/onboarding/page.tsx` → `app/onboarding/platba/page.tsx`; `lib/auth/actions.ts`.
- **Problem:** The 2 890 Kč buyer must create a full account (name + email + **10-char** password) as the *first* step, before any offer card or price framing. The full sell (book mockup, bullets, price, trust quote) lives only on screen 3 (`platba`). So cold mobile ads → signup + storyteller-name + payment = 3 screens / ~5 fields, with price as fine print until the end. The heaviest commitment (password) is front-loaded before the sell. (F2; relates to `vytrovit-ucet-hides-payment`.)
- **Change:** Surface the navy conversion-card content (book + 2 890 Kč + 4 bullets + quote) on the signup page itself (its left aside is currently a generic pitch with no price). Better: reorder so the low-friction storyteller-name step precedes account creation, or collapse signup+storyteller into one screen and defer the account to just before payment. Drop the password minimum from 10 to 8 to match the senior-credentials form. As an interim, add the signup sub-label "Krok 1 ze 3 — pak uvidíte cenu (2 890 Kč, jednorázově)" so price isn't a surprise.
- **Effort:** L. **Impact:** high.

**P1-3 · No reassurance stack at any purchase CTA (substitutes for the missing guarantee)**
- **Files:** `app/onboarding/platba/page.tsx`, `app/kniha/objednat/standard-order.tsx`, `app/kniha/sestavit/order-form.tsx`.
- **Problem:** There is deliberately no money-back guarantee, so risk-reduction must come from honest alternatives — but human support ("píše vám člověk"), data ownership ("přístup/kniha je vaše napořád"), and delivery timeline all live post-purchase or on `/cenik`, never under the buy button. For cold mobile buyers committing 2 890 / 599 / 899 Kč with no refund, the area under each CTA does too little. (T4.)
- **Change:** Add a compact 3-item true-claims row under each primary CTA: "✓ Píše a pomáhá vám člověk · ✓ Přístup/kniha je vaše napořád · ✓ Zabezpečená platba". For gift checkouts add "✓ Poštovné zdarma · doručení do 3–4 týdnů". Pure copy.
- **Effort:** S. **Impact:** high.

**P1-4 · "Tisk je v ceně" not restated at the moment of payment (main product)**
- **Files:** `app/onboarding/platba/page.tsx` INCLUDED array (~L16–21); the frame exists on `app/cenik/page.tsx`.
- **Problem:** The strongest value/reassurance for 2 890 Kč — "první tištěná kniha je v ceně, no separate print charge" — is built on `/cenik` but absent from `platba`, where the money is committed. A cold buyer landing deep via an ad may read the price as "access only" with print feared as an upsell. (T3.)
- **Change:** Add one bullet to the platba INCLUDED list: "První tištěná kniha v ceně — žádný další poplatek za tisk" (optionally "tvrdé desky, šitá vazba, QR s hlasem"). Pure copy add to an existing array.
- **Effort:** S. **Impact:** high.

**P1-5 · Standard checkout CTA says "Pokračovat k platbě" on the free/launch path**
- **Files:** `app/kniha/objednat/standard-order.tsx` (static label); `lib/shop/order-actions.ts` (free path `priceCzk===0` → `/kniha/hotovo`, no Stripe).
- **Problem:** On the free launch path the button promises a payment that never happens — reads as a bug/bait. `platba` already does this right (switches label on `priceCzk>0`). (T5.)
- **Change:** Derive `isFree` (totalCzk===0) and switch the label to "Objednat knihu" when free, "Pokračovat k platbě" when paid. Mirror the proven platba pattern; same for the `order-form.tsx` fineprint that assumes a gateway redirect.
- **Effort:** S. **Impact:** medium.

**P1-6 · Homepage has no sticky mobile CTA at all**
- **Files:** `app/page.tsx` (bespoke 814-line page, does NOT use `Shell`).
- **Problem:** The canonical Meta-ad landing page is the one marketing page without a persistent mobile CTA (`/cenik`, `/darek`, `/kniha` all get one via `Shell`). A cold mobile visitor who scrolls past the hero has no CTA until deep in the page. (`home-no-sticky-cta`.)
- **Change:** Add the `.sticky-mobile-cta` markup to the homepage (fixed bottom bar ≤900px, hero CTA "Začít sbírat vzpomínky" → `/signup`, safe-area padding) plus `pb-20 md:pb-0` on `<main>`. Reuse the existing CSS class.
- **Effort:** S. **Impact:** high.

**P1-7 · Homepage hero headline overflows narrow phones**
- **Files:** `app/page.tsx` (~L134–138 hero H1 with hard `<br>`); `globals.css` `.editorial h1 { clamp(48px,7.5vw,96px) }`.
- **Problem:** At 360–390px the clamp floors at 48px (very large), and the hard-coded `<br>` mid-sentence forces ragged wrapping/overflow. First impression for a cold ad-clicker. (`home-hero-headline-overflow`.)
- **Change:** Scope a hero-specific mobile clamp (e.g. `.hero h1 { clamp(30px,8.5vw,96px) }`) and remove the hard `<br>` (let it wrap, or `text-wrap: balance`).
- **Effort:** S. **Impact:** medium.

**P1-8 · Configurator first-run clarity — the fast path is never communicated**
- **Files:** `app/kniha/sestavit/configurator.tsx` (~L387–417, phase view; `buildDefault()` pre-selects ~28 questions).
- **Problem:** A cold visitor lands in a two-pane editor with a dark book already part-filled and no line saying it's pre-filled and orderable as-is. The page reads as "a lot of work" rather than "mostly done, tweak if you like." (Merged: `cfg-3`, F6.)
- **Change:** Add a single dismissible intro line under the phase tabs: "Knihu jsme pro vás předvyplnili oblíbenými otázkami. Můžete ji rovnou objednat, nebo si ji upravit." Style the top-bar "K objednávce" as gold primary so finishing early reads as first-class; add a "Doporučeno" chip on default cards.
- **Effort:** S. **Impact:** medium.

**P1-9 · Gender unselected by default → slash-fallback questions ("vyrůstal/a") on first view**
- **Files:** `configurator.tsx` (gender default `null`; `resolveGender`); also the standard checkout's gender pills.
- **Problem:** Every gendered question renders with ugly "/a" slashes exactly when the buyer is reading questions to decide. The "Pro koho:" toggle is small, easy to miss, and ambiguous (reads as "who is this for" = the buyer). (`cfg-4`.)
- **Change:** Make recipient gender a quick first micro-step ("Pro koho knihu chystáte? Ženu / Muže") before the editor so questions always render clean; relabel the toggle "Příjemce:" / "Kniha pro:"; make it prominent on mobile. (Pairs with P1-10's top-bar reflow.)
- **Effort:** S. **Impact:** medium.

**P1-10 · Configurator mobile layout — crowded top bar + pool buries the book + no add feedback**
- **Files:** `configurator.tsx` (top bar L203–242; pool rendered before book L388–516; `addSuggestion` prepends + `scrollBookTop`); `globals.css` `.kc-top` (`flex-wrap`, `.kc-top-cta min-width:196px`), `@media ≤860px` L3136–3155 (sets `overflow:visible`, so the scroll-to-top is a no-op).
- **Problem:** Three compounding mobile failures: (a) the top bar packs 5 control groups into one wrapping row that goes ragged at 360–390px and eats vertical space; (b) on the single-column stack the dark "book" panel renders *below* the suggestions, and tapping a suggestion adds to the off-screen book with **zero on-screen feedback**; (c) `scrollBookTop` targets a ref that no longer scrolls on mobile. The core "pick a question → see it land" loop has no visible result. (Merged: `cfg-1`, `cfg-5`, `cfg-pool-buries-book`, `cfg-top-bar-density`.)
- **Change:** Add a ≤720px reflow: hide the title under ~480px, drop the CTA min-width (shrink to "Objednat"), move the gender toggle into the body (ties to P1-9), and either reverse visual order so the book sits first (`order:-1`) or use a "Návrhy | Vaše kniha (N)" segmented control. Give the add action immediate feedback — pulse/animate the book counter and/or auto-scroll to and flash the new card. Move the primary "K objednávce" into the sticky bottom nav (thumb zone).
- **Effort:** M. **Impact:** high.

**P1-11 · Sub-44px tap targets across pickers (one-handed errors mid-purchase)**
- **Files:** `globals.css` `.kc-text-opt` (~30px), `.co-swatch` (34px), `.co-textopt` (~26px), `.kc-book-remove` (26px).
- **Problem:** Cover/text pills, swatches, and the remove-X all fall below the 44px minimum and sit close together — exactly the fiddly micro-taps that frustrate a phone buyer. (`cfg-swatch-tap-targets`.)
- **Change:** On `@media (pointer:coarse)` give these `min-height:44px` / expand hit boxes to 44×44 (keep the visible dot size via padding); enlarge `.kc-book-remove` to ~40px with more spacing from the textarea.
- **Effort:** S. **Impact:** medium.

### P2 — polish, consistency, hygiene, accessibility

**P2-1 · Orphaned/contradictory `/onboarding/credentials` step** — says "Krok druhý ze tří" with a 3-segment bar, but the live flow is 2 steps (`startOnboarding` goes start→platba); creating the storyteller account "is no longer part of onboarding." Remove the route (move to settings/dashboard) or restyle it as "Hotovo · nepovinné" like `/onboarding/zdroj`. `app/onboarding/credentials/page.tsx`. (F3.) — **S.**

**P2-2 · Signup email-confirmation branch can hard-block the funnel** — `signUpOwner`'s `checkEmail:true` fallback renders an inbox wall whenever Supabase confirm-email is ON; assumes it's OFF but the dependency is invisible. Keep confirm-email OFF (intended), log/alert if the fallback ever fires in prod, add resend + "your account is already created" reassurance, and verify the prod setting at launch. `signup-form.tsx`, `lib/auth/actions.ts`. (F4.) — **S.**

**P2-3 · Hero CTA routes cold mobile traffic into the heaviest/pricier flow first** — `/kniha` hero is "Sestavit vlastní knihu" (899 Kč, multi-phase editor, gold), while the simpler 599 Kč standard book is a demoted outline button. Lead with (or equally weight) the lower-friction standard book on mobile and position custom as the upgrade; or give the hero a neutral "Vybrat knihu" → pricing section; A/B test. `app/kniha/page.tsx`. (Merged: F5, `cheapest-product-secondary-cta`.) — **S.**

**P2-4 · Configurator framed as a mandatory 6-phase slog** — the prominent bottom nav ("Další fáze ↗" / "Na souhrn ↗") and phase pills give no "you can stop anytime, defaults are ready" signal. Make the top-bar "K objednávce" the gold primary and phase nav secondary (pairs with P1-8). `configurator.tsx`. (F6.) — **S.**

**P2-5 · Launch price-config hygiene (main product)** — `book_base` defaults to 0 (`lib/stripe/server.ts`), so the platba screen can show "2 890 Kč" trust price beside a *non-payment* CTA on the free path. Before launch set `PRICE_BOOK_BASE_CZK=2890` in prod, verify paid CTA + Stripe redirect end-to-end, and add a checklist assertion that displayed price === charged price (fail loudly if a non-zero trust price shows while `priceCzk===0`). `platba/page.tsx`, `lib/stripe/server.ts`. (F7.) — **S.**

**P2-6 · Unify the "Závazně objednat" verb across gift checkouts** — the custom order form uses the funnel's heaviest, most legalistic verb on its most-invested step, while the standard checkout uses the calmer "Pokračovat k platbě." Unify on "Pokračovat k platbě" for both; keep the binding-order disclosure in fineprint. `order-form.tsx:275` vs `standard-order.tsx:336`. (Merged: F8, T6, `zavazne-objednat-anxiety`.) — **S.**

**P2-7 · Main payment CTA breaks the brand's gold-pill system** — `platba` renders `buttonVariants({variant:'primary'})` with a hand-rolled arrow badge, not the canonical `.btn-gold` / `.auth-submit` pill used on every other surface. The signature CTA differs exactly where it matters most. Render it as `.btn .btn-gold .btn-gold-full` with the standard `.arrow`, or make `primary` pixel-identical. `platba/page.tsx`, `components/ui/button.tsx`. (`cta-system-split-platba`.) — **M.**

**P2-8 · Thin post-purchase confirmation page** — after paying 599–899 Kč the buyer lands on a bare centered hero (no receipt, no cover thumb, no order number, no timeline) even though `?order=<id>` is passed and never read. Promote to a real confirmation card: cover thumbnail (reuse `.co-thumb`), tier + question count, total, shipping city, order ref, calm 3–4 week timeline, warm next step. `app/kniha/hotovo/page.tsx`. (`confirmation-page-thin`.) — **M.**

**P2-9 · Two gift checkouts diverge (radius, swatch row, summary, fields, CTA)** — `/kniha/objednat` is "4px world" with a cover thumbnail + summary; `/kniha/sestavit` order form is "8px world" with no thumbnail/summary, an extra note field, and a different CTA. Pick one radius scale (inputs/cards 8px, pills/swatches 999px), give the custom form the same `.co-summary` thumbnail header, split the standard checkout's swatch row into labeled "Barva přebalu" / "Barva písma" sub-rows (drop the `margin-left:auto`), and reconcile the field set so the two read as one product with two entry points. `globals.css`, `standard-order.tsx`, `order-form.tsx`. (Merged: `gift-checkout-radius-inconsistency`, `standard-swatch-row-fragile`, `order-form-vs-standard-divergence`.) — **M.**

**P2-10 · Product name collision ("Kniha vzpomínek")** — both the main app's printed book and the gift fill-in book share the phrase, so buyers may conflate the 2 890 vs 599/899 products. Reserve "Kniha vzpomínek" for one product; name the gift consistently "Vyplňovací kniha vzpomínek" and surface the one-line difference ("papír a pero, bez aplikace a nahrávek") near the top of `/kniha`, not only in the last FAQ. `app/page.tsx`, `app/kniha/*`, `platba` BookCover. (`kniha-vs-app-name-collision`.) — **M.**

**P2-11 · Add legal/consent line under each purchase CTA** — both gift checkouts render full-viewport chrome with no `SiteFooter`, so the pay screen has no reachable Podmínky/Soukromí link and no consent line (trust + consumer-law gap). Add one quiet navy-muted line under each CTA: "Pokračováním souhlasíte s [Obchodními podmínkami](/podminky) a [zpracováním osobních údajů](/soukromi)." `standard-order.tsx`, `order-form.tsx`, `platba/page.tsx`. (T2.) — **S.**

**P2-12 · Show delivery lead-time before pay (gift)** — "tisk a doprava ~3–4 týdny" appears only post-purchase; occasion-driven buyers (Vánoce/narozeniny) need it before paying. Add "Vytištění a doručení obvykle do 3–4 týdnů · poštovné zdarma" to both gift pre-pay summaries, reusing the exact `/kniha/hotovo` wording. (T7.) — **S.**

**P2-13 · Replace placeholder social proof on platba with a true expectation-setter** — the ★★★★★ "Stovky rodin" block is unverified and must not be leaned on; swap for a "Co se stane po zaplacení" 2–3 step mini-list or the human-support line. Keep the rest of the (strong) card as-is. `platba/page.tsx`. (T8.) — **S.**

**P2-14 · Minor polish & a11y** — auto-grow the configurator question textareas (`rows={2}` + `resize:none` clips long custom questions; `field-sizing:content`); top-align the recap grid (`align-items:start`) so the cover sits level with the heading; add a scroll-shadow on the phase-tab strip; switch the standard checkout's `justify-content:center` to start so long forms scroll from the top; wrap gender/cover toggles in `role="radiogroup"` + `aria-labelledby` with `role="radio"`/`aria-checked`; align bullet wording between `/cenik` and `/onboarding/platba`. (Merged: `cfg-7/8/9`, `cfg-textarea-fixed-rows`, `configurator-recap-vertical-centering`, `checkout-vertical-center-clipping`, `checkout-pill-aria-grouping`, `voice-and-bullets-are-strong`.) — **S each.**

---

## Per-surface summary

**Homepage CTA (`/`)** — Add a sticky mobile CTA (P1-6, missing entirely) and fix the hero H1 mobile clamp + remove the hard `<br>` (P1-7). Differentiate the "Kniha vzpomínek" naming so it isn't conflated with the gift book (P2-10).

**`/cenik`** — One-line price-trap fix on the gold-cover add-on row (P0-2). Align the INCLUDED bullets with the platba list (P2-14).

**`/darek`** — Highest-risk page: stop promising a gift mechanism the funnel doesn't deliver. Copy fix now, real gift branch later (P0-1). State the price at least once near a CTA.

**Configurator (`/kniha/sestavit`)** — Touch reorder is the P0 (P0-4). Then the mobile layout cluster: crowded top bar, pool-buries-book, no add feedback (P1-10), first-run clarity (P1-8), gender-first micro-step (P1-9), tap targets (P1-11), and the silent cancel handoff (P1-1). Polish: framing, textarea, recap alignment, scroll-shadow (P2-4/14).

**Gift checkouts (`/kniha/objednat` standard + `/kniha/sestavit` order form)** — Structurally strong; do NOT rework. Add reassurance row (P1-3), free-path CTA label (P1-5), legal line (P2-11), delivery lead-time (P2-12), unify the "Závazně objednat" verb (P2-6), and converge the two checkouts visually (P2-9).

**Gift landing (`/kniha`)** — Fix the sticky CTA pointing at the wrong product (P0-3). Reconsider leading cold mobile traffic into the pricier custom flow (P2-3).

**Main purchase / platba (`/onboarding/platba` + signup/onboarding)** — Surface offer/price before the password wall (P1-2). Restate "tisk v ceně" (P1-4), add reassurance row (P1-3), unify the gold-pill CTA (P2-7), replace placeholder proof (P2-13), launch price-config hygiene (P2-5), and remove the orphaned credentials step (P2-1).

---

## Honesty notes (reassurance without fabrication)

- **No fake social proof.** The ★★★★★ "Stovky rodin" / babička quote on `platba` (and any equivalent) is placeholder and unverified — must NOT be leaned on. Replace with a true expectation-setter ("Co se stane po zaplacení") or the human-support line (P2-13). Do not re-strip the owner-kept homepage proof; this note applies to checkout-surface reassurance.
- **No money-back guarantee.** It doesn't exist by design. The reassurance under every CTA must use only true claims: human support ("píše a pomáhá vám člověk"), data/book ownership ("přístup/kniha je vaše napořád"), print-in-price, secured payment, free shipping, 3–4 week delivery (P1-3, P1-4, P2-12). Never imply refunds.
- **Price must match the charge.** The gold-cover copy (P0-2) and the free-vs-paid CTA labels (P1-5) and the trust-price-vs-priceCzk config (P2-5) must all be reconciled so no buyer is shown a price they aren't charged or charged a price they weren't shown.
- **Promise must match delivery.** `/darek` (P0-1) must describe only what actually ships until the gift branch exists.
- **Urgency stays tasteful.** No countdowns or scarcity. Keep the existing calm register ("kniha na vás počká"). Lead-time and "first question this week" are honest expectation-setting, not urgency — use those.

---

## Suggested implementation order (focused, mobile-first PRs)

**PR 1 — "Honesty & price-truth" (S, copy-only, launch-blocker)**
P0-2 (cenik gold-cover line), P0-1 *copy half* (`/darek` truthful copy + badge), P1-5 (free-path CTA label), P2-11 (consent line ×3), P2-13 (replace placeholder proof). No schema, no migration — ships same day and removes the overcharge + the worst promise mismatch.

**PR 2 — "Right product, right CTA on mobile" (S)**
P0-3 (`Shell` sticky-CTA props + `/kniha` override), P1-6 (homepage sticky CTA), P1-7 (hero H1 clamp + `<br>`). All mobile-first, all small.

**PR 3 — "Reassurance & value at the pay moment" (S)**
P1-3 (reassurance row ×3), P1-4 (tisk-v-ceně bullet on platba), P2-12 (gift delivery lead-time), P2-6 (unify CTA verb). Pure copy adds to existing arrays/components.

**PR 4 — "Configurator touch + mobile layout" (M)**
P0-4 (▲▼ reorder + pointer/coarse handling), P1-10 (top-bar reflow, book-first / segmented control, add feedback), P1-11 (44px tap targets), P1-9 (gender-first micro-step), P1-8 (first-run intro line + gold "K objednávce"). The single biggest mobile-UX PR.

**PR 5 — "Cancel-recovery & checkout convergence" (M)**
P1-1 (cancel handoff on both checkouts), P2-9 (radius + swatch-row + summary convergence), P2-7 (gold-pill on platba), P2-8 (real confirmation page), P2-14 (a11y + textarea + alignment polish).

**PR 6 — "Main-funnel reorder" (L)**
P1-2 (offer/price before the password wall; password 10→8; signup stepper), P2-1 (remove orphaned credentials step), P2-2 (confirm-email guardrail), P2-5 (launch price-config assertion), P2-10 (name disambiguation).

**PR 7 — "Real gift branch" (L)**
P0-1 *build half* — gift step after `gift=1` collecting recipient + dedication + send-date, certificate PDF generation. Ship the copy fix in PR 1 first so the page is honest in the meantime.
