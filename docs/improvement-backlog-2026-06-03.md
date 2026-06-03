# Improvement backlog — 2026-06-03

Senior-engineer review of the Vzpomínkář codebase (Next.js 15 + Supabase, Czech
memorial app). This is a **prioritized, NEW-findings** list: items already tracked
in `PRE-LAUNCH.md` and `AUDIT.md` are deliberately not repeated (Stripe go-live,
custom SMTP/domain, KV in prod, full-book PDF render, configurator order flow,
leaked-password protection, abandoned-onboarding email, `formatCzk`/`formatDate`
dedup, lenis/reveal consolidation — all already on those lists).

Grouping: **P0** bugs/security · **P1** incomplete flows · **P2** UX/polish/perf ·
**P3** nice-to-have / tech-debt.

The verdict from `AUDIT.md` still holds: this is an above-average pre-launch
codebase (clean typecheck/lint/build, 0 `any`, complete RLS, disciplined
service-role usage). The findings below are refinements, not rewrites.

Three trivial quick-wins from this review are **already implemented** on this
branch — see the bottom of the doc.

---

## P0 — bugs / security

### P0-1 — Senior photo-upload previews are blocked by CSP in production ✅ FIXED
- **Where:** `next.config.ts` (CSP `img-src`) vs `app/(senior)/new-memory/photo/photo-form.tsx:49,55,151`.
- **Why it matters:** the photo form renders `<img src={URL.createObjectURL(...)}>`
  (a `blob:` URL) for each picked/compressed thumbnail, but the production CSP was
  `img-src 'self' data: https://*.supabase.co` — no `blob:`. In production the
  senior picks photos and sees **broken/empty thumbnails** (the recorder's
  `media-src` already allows `blob:`; `img-src` was missed). Pure functional
  regression in a primary senior flow; invisible in local dev where CSP is laxer
  to notice.
- **Fix:** add `blob:` to `img-src` to mirror `media-src`. **Done in this branch.**

### P0-2 — Missing-OpenAI-key placeholder transcript gets persisted to real recordings
- **Where:** `lib/memories/transcribe.ts:5,20` (returns `PLACEHOLDER_TRANSCRIPT`
  when `OPENAI_API_KEY` is unset); persisted in `lib/memories/actions.ts:294`
  (`saveAudioMemory` → `after()`), and again in
  `app/api/cron/transcribe-backfill/route.ts:53-55`.
- **Why it matters:** if the key is ever missing/expired/revoked in production, a
  senior's real recording is silently saved with the literal text
  *"testovací nahrávku zapsána, zde bude text, který blízký namluví."* That fake
  string then surfaces in the owner archive, the book preview, **and the public QR
  page `/v/[token]`** — and is permanent (book printed from it). Worse, the
  backfill cron counts the placeholder as `filled`, so the row is no longer NULL
  and **never retried** once a real key returns → poisoned forever.
  Note the inconsistency: `polish.ts:65` and `extract-metadata.ts:48-51` both
  correctly return null/EMPTY on a missing key; only `transcribe.ts` injects junk.
- **Fix:** return `null` on missing key (treat as "skipped", leave transcript NULL
  so the backfill cron retries). If a dev placeholder is genuinely wanted, gate it
  on `process.env.NODE_ENV !== "production"`.

### P0-3 — `purchaseBook`/checkout origin still defaults to `localhost:3000`
- **Where:** `lib/stripe/checkout.ts:12-14` (`baseUrl()` reads `NEXT_PUBLIC_APP_URL`
  directly, default `http://localhost:3000`), used for every Stripe `success_url` /
  `cancel_url`.
- **Why it matters:** `AUDIT.md` deferred centralizing this into `lib/site.ts`, but
  it's a launch landmine: if `NEXT_PUBLIC_APP_URL` is ever unset in a Vercel env,
  paying customers get redirected to `localhost` after checkout. Everything else
  already funnels through `SITE_URL` (which has a sane prod default); this one path
  does not.
- **Fix:** replace `baseUrl()` with `SITE_URL` from `lib/site.ts` (one import, three
  call-sites). Safe to do now — the free-path (price 0) doesn't touch it, and it
  only changes the fallback, not configured behaviour. (Left unimplemented here
  because it sits on the payments path, which the task scoped out.)

---

## P1 — incomplete / half-built flows

### P1-1 — Weekly-reminder "secure link" (`/q/{token}`) is half-built
- **Where:** `lib/email/templates.ts:284-286` builds `${appUrl}/q/${token}` when a
  `token` is present, but **no `app/q/[token]` route exists**, and the only caller
  (`app/api/cron/weekly-reminder/route.ts:116-120`) never passes a `token`.
- **Why it matters:** the senior-facing reminder always falls back to
  `/senior-login` — i.e. the senior must type username+password to answer the
  weekly question, defeating the "click one link" promise in `PRODUCT.md`. The
  template's token branch is dead code that looks done.
- **Fix:** either (a) build the `app/q/[token]/route.ts` magic-link route (mint a
  one-time, scoped, expiring token per assignment, exchange → senior session →
  redirect to the answer page) and pass it from the cron, or (b) delete the
  `token` branch from the template until it's real, to avoid a false sense of
  completeness.

### P1-2 — Gift-configurator order step is a hard-coded fake "done" screen
- **Where:** `app/kniha/sestavit/configurator.tsx:101-118` (`ordered` state),
  `190-197` ("Objednat a zaplatit" just calls `setOrdered(true)`).
- **Why it matters:** already flagged in `PRE-LAUNCH.md#14` at a high level, but
  worth a concrete note: the button promises payment ("Objednat a zaplatit"),
  shows a success screen ("kniha je sestavená"), yet **nothing is persisted or
  charged** — the whole selection lives only in `localStorage`. A real visitor who
  "orders" believes they bought a book; you have no record of it. This is the
  single biggest "looks shipped, isn't" gap on the public site.
- **Fix:** as PRE-LAUNCH says — guest checkout → `shop_orders` row (questions JSON
  + recipient gender) → Stripe → confirmation email. Until then, soften the copy
  to "rezervovat / poslat nezávazně" so it doesn't claim a completed purchase.

### P1-3 — Configurator can't capture recipient gender → questions stuck on "/a"
- **Where:** `app/kniha/sestavit/configurator.tsx:30,86,223` all call
  `resolveGender(q.text, null)` (always slash form). `PRE-LAUNCH.md#14` notes it;
  the data plumbing (`lib/gender.ts`, the `{masc|fem}` tokens in
  `lib/book-shop/phases.ts`) is already in place.
- **Why it matters:** the printed gift book shows every gendered verb as
  "vyrůstal/a", "{hrdý|hrdá}"→"hrdý/á" etc. — reads like a form, not a keepsake.
- **Fix:** add a one-question "Pro koho? (žena / muž)" step up front, store it in
  selection state + the order, and thread it as the `Gender` arg into all three
  `resolveGender` calls. Low effort, high polish payoff.

### P1-4 — Leads are emailed but never stored; silently lost if Resend is down/unset
- **Where:** `app/api/leads/route.ts:15,51-70` (TODO: no `leads` table; only a
  best-effort Resend notification, swallowed on failure).
- **Why it matters:** the homepage lead-magnet ("Pošleme ukázku knihy") is the top
  of the funnel. Today, if `RESEND_API_KEY`/`LEADS_NOTIFY_TO` is unset or Resend
  errors, the email is captured into the void — no DB row, no retry, user still
  sees "success". Pre-revenue, losing warm leads is expensive.
- **Fix:** add a `leads` table (email, source, created_at, UA/IP optional) and
  insert via the admin client before the notification. Cheap insurance; also gives
  you a real funnel metric.

---

## P2 — UX / polish / performance

### P2-1 — New-memory owner email said "přidal(a)" regardless of gender ✅ FIXED
- **Where:** `lib/email/templates.ts:350-353` (was `${name} přidal(a) …`).
- **Why it matters:** the app already knows the storyteller's gender
  (`profiles.gender`) and genders everything else via `resolveGender`; this one
  email used the clumsy "(a)" form. The notification email is the owner's main
  recurring touchpoint — getting "Babička Marie přidala" right is exactly the
  warm-detail this brand sells.
- **Fix:** thread `seniorGender` into `newMemoryNotificationEmail` and render
  `{přidal|přidala}` via `resolveGender`. **Done in this branch** (caller already
  loaded the senior profile; only added `gender` to the select).

### P2-2 — Dashboard greeting genders the verb by guessing from the name ending
- **Where:** `app/(app)/dashboard/page.tsx:59-63` — `vyprávěl${firstName.endsWith("a")||endsWith("á") ? "a" : ""}`.
- **Why it matters:** this name-ending heuristic is both unnecessary (the
  `profiles.gender` column exists) and wrong for real names (e.g. "Sáva", "Nikita",
  "Jarda" → mis-gendered; the dashboard query at `:28-34` doesn't even select
  `gender`). It contradicts the `resolveGender` approach used everywhere else.
- **Fix:** add `gender` to the seniors query and gender the copy with
  `resolveGender("{vyprávěl|vyprávěla}", senior.gender)` (use the slash form when
  multiple seniors / unknown).

### P2-3 — Senior `/home` shows only the single newest due question
- **Where:** `app/(senior)/home/page.tsx:45-69` — `order scheduled_for desc, limit 1`.
- **Why it matters:** if a senior has several un-answered due prompts (owner queued
  a few, or they skipped a week), only the most-recent one is ever shown; older due
  questions are silently invisible until the newer one is answered. For a 65+ user
  who answers sporadically, questions can effectively get "stuck behind" newer ones.
- **Fix:** prefer the **oldest** un-answered due prompt (`asc`) so nothing is
  skipped, or surface a small "máte i starší otázku" affordance. (Owner-side and
  cron already iterate all rows; only the senior home shows one.)

### P2-4 — Hard-coded "52 otázek" in senior copy will drift from `prompt_cap`
- **Where:** `app/(senior)/home/page.tsx:184` ("Odpověděli jste na všech 52
  otázek"); `prompt_cap` is per-book (`lib/books/server.ts:118-133`, default 52).
- **Why it matters:** the celebratory completion message hard-codes 52, but the cap
  is a column — any book with a different cap will show the wrong number on the most
  emotionally important screen.
- **Fix:** read the book's `prompt_cap` and interpolate it (or phrase
  cap-independently: "Odpověděli jste na všechny otázky").

### P2-5 — Weekly-reminder owner-fallback emails the senior-addressed template to the owner
- **Where:** `app/api/cron/weekly-reminder/route.ts:131-139`.
- **Why it matters:** when there's no senior email, the owner receives the
  senior-voiced body ("Dobrý den, {seniorName}…", CTA "Odpovědět hlasem" → senior
  login) with only the subject swapped. The owner can't answer; the copy is
  addressed to someone else. Minor but off-brand.
- **Fix:** a small owner-addressed variant ("{seniorName} má tento týden otázku —
  připomeňte mu ji"), or drop the senior CTA for that branch.

### P2-6 — Print order links to the family's most-recent book, not necessarily the right volume
- **Where:** `lib/book/actions.ts:41-47` (`placeBookOrder` picks
  `order by created_at desc limit 1`).
- **Why it matters:** with multiple volumes/seniors, the print order can attach to
  an unpaid or unrelated book. `book_id` is nullable/"best-effort", so it won't
  crash, but the fulfilment link may be wrong.
- **Fix:** pass the explicit `bookId` being printed from the book page into
  `placeBookOrder` rather than re-deriving it.

### P2-7 — Stripe print-order webhook idempotency is read-then-update (non-atomic)
- **Where:** `app/api/webhooks/stripe/route.ts:93-112`.
- **Why it matters:** unlike the book branch (atomic `paid=false→true` claim, see
  `lib/books/server.ts:30-47`), the print branch does a SELECT-then-UPDATE. Two
  concurrent deliveries of the same event could both pass the pre-check and each
  write an `activity_log` row (duplicate audit entries; the unique
  `stripe_payment_intent_id` still protects the order itself).
- **Fix:** rely on the unique constraint — `update ... .eq("id", orderId)
  .is("stripe_payment_intent_id", null)` and only log when a row was actually
  updated (mirror `markBookPaid`).

### P2-8 — `/v/[token]` public page has no rate-limiting / abuse protection
- **Where:** `app/v/[token]/page.tsx:49-79` (service-role read keyed solely on the
  16-hex token; mints a 6h signed audio URL each load).
- **Why it matters:** the token (~64 bits) is strong, so this isn't an enumeration
  risk, but the route is public, un-throttled, and does a DB read + storage
  signing per hit — a cheap target for scraping/DoS once the domain is live, and
  it bypasses RLS by design. Currently fine; worth a guard before any volume.
- **Fix:** add an IP rate-limit (reuse `lib/rate-limit.ts`), and consider caching
  the signed URL within its lifetime. (No action needed pre-launch; note for the
  domain switch alongside `PRE-LAUNCH.md#15`.)

---

## P3 — nice-to-have / tech-debt

### P3-1 — `lib/gender.ts` had zero tests despite being load-bearing Czech grammar ✅ FIXED
- **Where:** used in ~15 files (senior home, prompts, archive, book preview, QR
  page, cron, emails). No test existed.
- **Fix:** added `tests/unit/gender.test.ts` (11 cases: male/female/null token
  rendering, common-prefix slash collapse, identical branches, multi-token,
  `genderFromSeniorRole` mapping). **Done in this branch.**

### P3-2 — Unused eslint-disable directive in the QR page
- **Where:** `app/v/[token]/page.tsx:128` (`// eslint-disable-next-line
  jsx-a11y/media-has-caption`).
- **Why it matters:** build emits "Unused eslint-disable directive" warning. The
  `<audio>` there is a voice recording with no caption track, so the rule doesn't
  fire — the directive is stale.
- **Fix:** remove the directive (or add a real `<track>`/`aria-label`). Trivial;
  clears the only lint warning in the build.

### P3-3 — Contact page has launch-blocking placeholder legal details
- **Where:** `app/kontakt/page.tsx:33,42,51` (TODO: real phone, registered
  address, IČO/DIČ before the paid version).
- **Why it matters:** for a paid Czech service, IČO/DIČ + a contact address are
  effectively mandatory (consumer/billing law). Easy to forget behind a TODO.
- **Fix:** fill in before charging real money (pairs with the Stripe go-live in
  PRE-LAUNCH).

### P3-4 — Email footer / fallback addresses are hard-coded, not centralized
- **Where:** `lib/email/templates.ts:112` (`ahoj@vzpominkar.cz` in every footer),
  `lib/email/provider.ts:78` (`onboarding@resend.dev` fallback `from`).
- **Why it matters:** `PRE-LAUNCH.md#3` notes the contact email isn't centralized;
  with the domain switch these need to move with it. The `resend.dev` `from`
  fallback will silently send from a sandbox domain if `EMAIL_FROM` is unset in
  prod (deliverability hit).
- **Fix:** centralize the contact address (e.g. in `lib/site.ts`) and assert
  `EMAIL_FROM` is set in production.

### P3-5 — `app/dev/*` design-gallery routes ship in the build
- **Where:** `app/dev/components`, `app/dev/fonts`, `app/dev/fonts-display`,
  `app/dev/book-preview` (guarded from production rendering by
  `app/dev/layout.tsx`, per AUDIT Phase 4).
- **Why it matters:** they're correctly gated at runtime, but still compiled and
  add routes/bundle. Minor.
- **Fix:** optionally exclude from the production build, or leave as-is (low value).

### P3-6 — No automated test covers the gendered email/templates rendering
- **Where:** `lib/email/templates.ts` (no tests; subjects/bodies built by string
  concat with user names + now gender tokens).
- **Why it matters:** templates are easy to break silently (a stray token, an
  un-escaped name). A couple of snapshot/contains assertions would lock in the
  gendering and the HTML-escaping (`esc()`).
- **Fix:** add `tests/unit/email-templates.test.ts` asserting e.g.
  `newMemoryNotificationEmail({... seniorGender:"female"})` contains "přidala" and
  that `esc()` neutralizes `<script>` in a display name.

---

## Implemented in this branch (safe, self-contained quick-wins)

1. **P2-1** — `newMemoryNotificationEmail` now genders the verb via
   `resolveGender("{přidal|přidala}", seniorGender)`; caller
   (`lib/memories/actions.ts`) threads `profiles.gender` (added to the existing
   select — no extra query).
2. **P0-1** — CSP `img-src` now includes `blob:` (mirrors `media-src`), unblocking
   the senior photo-upload preview thumbnails in production.
3. **P3-1** — added `tests/unit/gender.test.ts` (11 cases) covering `lib/gender.ts`.

Gate: `pnpm typecheck` ✅ · `pnpm test` ✅ 59/59 · `pnpm build` ✅.

Everything else above is left as backlog (read-only analysis); none of the
unimplemented items touch payments, auth, or schema beyond what's noted.
