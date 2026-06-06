# Multi-channel question delivery — Phase 1 review

**Date:** 2026-06-05
**Scope:** SMS via smsbrana + email + WhatsApp (noop) question-delivery layer (`lib/messaging/*`, the weekly cron, consent UI in `add-senior-panel.tsx` / `delivery-form.tsx`, `senior-actions.ts`, the delivery-log migration & RLS).
**Method:** 5 parallel dimension reviews (security, correctness, optimization, bundle/loading-time, code quality), each high/critical finding put through an adversarial verification pass. Severities below are the **adjusted** post-verification severities; refuted findings are dropped to the appendix.

---

## Executive summary

**Overall health: good, with one launch-blocker.** The feature is well-architected — a clean channel-agnostic provider abstraction that genuinely generalizes the existing email pattern, an irreversible-send seam (`sendAndConfirm`) correctly DRYed out of both dispatch paths, a security-conscious smsbrana provider (no secret leakage, ReDoS fixed, fail-closed cron auth, family-scoped RLS), and a delivery layer that is **100% server-only** and ships **zero bytes** to the browser. 45 new tests pass. The "never resend after a real send" idempotency invariant held up under adversarial probing.

There is, however, **one high-severity defect that must be fixed before any live send is enabled**, and a cluster of consent-state-machine correctness issues that ship alongside the (already-planned) opt-out write path.

### Counts by severity (adjusted, refuted dropped)

| Severity | Count | Findings |
|---|---|---|
| Critical | 0 | — |
| High | 1 | corr-01 |
| Medium | 6 | sec-01, corr-02, corr-03, corr-04, perf-01, cq-01 |
| Low | 11 | sec-02, sec-03, corr-05, corr-06, corr-07, perf-03, perf-04, cq-02, cq-03, cq-04, cq-05, cq-06, cq-07 |
| Info | 8 | sec-04, corr-08, perf-05 (opt), bundle perf-01…05, cq-08, cq-09 |

*(perf-01 and sec-01 are the same defect — the missing fetch timeout — seen from two dimensions; counted once as one medium.)*

### Single most important action

**Make the noop providers a non-success in production (corr-01).** Today, an owner can select SMS or WhatsApp in the live UI before provider credentials exist; the noop provider returns a synthetic message id, dispatch records `status='sent'`, the cron stamps `reminded_at`, and the assignment is **never re-selected**. The senior's weekly question is **permanently and silently lost** — the worst possible outcome for the elderly recipient the product is built around. Add an `isLive` flag (or throw in production when creds are unset) and fall back to email. This must land **before SMS/WhatsApp are selectable in production**, independent of when real credentials arrive.

---

## Does the new code's length/size affect UI loading time?

**No. The feature does not measurably affect UI loading time. The delivery layer ships 0 bytes to the browser.** This is proven three independent ways:

1. **Server-only isolation.** Every runtime messaging file begins with `import "server-only";` — verified directly:
   `lib/messaging/index.ts`, `render.ts`, `dispatch.ts`, `providers/smsbrana.ts`, `providers/whatsapp.ts`, `providers/email.ts` all carry the marker. The only file without it is `types.ts` (types-only, imported solely by server-only files). If any `"use client"` file ever imported this code, `server-only` would **hard-fail the build** — it does not. `grep` for a client component importing `lib/messaging` returns nothing.

2. **The bundle numbers.** The sole external importer of the delivery layer is the Node.js cron route, whose First Load JS is **183 B / 103 kB — byte-identical to every other API route** (e.g. `/api/webhooks/stripe`, `/api/leads`). The ~44 KB of dispatch/provider/`node:crypto` source traces into the server function, not any client bundle.

3. **First Load JS of the two affected client routes is in-family with existing authenticated routes:**

   | Route | Route size | First Load JS |
   |---|---|---|
   | `/family/[familyId]/rodina` | 10.3 kB | **147 kB** |
   | `/settings/otazky` | 4.08 kB | **141 kB** |
   | *(ref)* `/dashboard` | — | 124 kB |
   | *(ref)* `/family/[familyId]/prompts` | — | 129 kB |
   | *(ref)* `/family/[familyId]/memories/[memoryId]` | — | 136 kB |

   The shared chunk is unchanged at 103 kB. The two affected routes were already the heaviest authenticated forms in the app; the consent UI did not push them out of the existing band — the 147 kB on `/rodina` is driven by the pre-existing add/edit-senior forms, not this feature's delta.

**The only client-side changes** are the consent UI in `delivery-form.tsx` and `add-senior-panel.tsx`: a few `useState` hooks, a ~6-line phone-normalizer regex, a one-line consent-string builder, and conditional JSX. The single new import (`{channelNeedsConsent, consentText}` from `lib/validations/auth.ts`) pulls in only `zod`, which is already in every form bundle. Net client delta: **a few hundred bytes, within build-table rounding.** `senior-card.tsx` (listed in the brief) is **not modified** by this feature.

> The longer files in this feature — notably the 278-line `smsbrana.ts` — live entirely server-side and have **zero** loading-time cost. Length there is earned thoroughness for an irreversible, billed external API, not bloat that reaches the user's browser.

---

## Security

Secret handling is genuinely clean: `SMSBRANA_PASSWORD` and the md5 auth hash are never logged, returned, or stored — only the digest goes on the wire, and `last_error` / thrown errors carry credential-free provider messages (asserted by a test that the raw password appears in no param value). Host URLs are fixed constants (no SSRF), the XML parser is linear with a 64 KB pre-check (ReDoS fixed, tested), the cron is constant-time bearer auth that fails closed, and RLS on `prompt_delivery_log` is a correct family-scoped SELECT with service-role-only writes.

| Sev | Location | What | Impact | Fix | Verdict |
|---|---|---|---|---|---|
| **Medium** | `providers/smsbrana.ts:197-213` (& `whatsapp.ts:99-109`) | **sec-01 / perf-01:** provider `fetch` has no timeout / `AbortSignal` inside a `maxDuration=300` sequential cron | A hung provider socket (TCP accepted, no response — neither a `TypeError` nor a non-2xx, so failover does **not** fire) blocks the per-row `await` indefinitely. One slow recipient consumes the whole 300 s budget; Vercel kills the function mid-batch; every remaining senior that week is silently un-reminded and `reminded_at` is never stamped, so they aren't retried until next week. Availability/DoS-by-dependency on the irreversible send path. | Wrap each provider fetch in `AbortSignal.timeout(8000)` (Node 18+), classify timeout abort as a transport error so the existing backup-host failover (already idempotent via reused `sul`) fires. Apply to `whatsapp.ts` too. | *unverified — high confidence, mechanism inspected* |
| **Low** | `lib/auth/senior-actions.ts:142-143` | **sec-02:** opt-out columns are write-orphaned; re-saving an SMS/WhatsApp channel re-stamps `*_opted_in_at` without clearing `*_opt_out_at` | Today fail-safe (no opt-out writer exists). But once the **planned opt-out write path** lands, a re-save can't clear a prior opt-out (gate keeps suppressing — confusing but safe), and there's no audited transition guaranteeing an opt-out persists across a re-save. Consent-integrity gap. | Make opt-in/opt-out a single reconciled transition: when stamping `{channel}_opted_in_at`, explicitly null `{channel}_opt_out_at`; opt-out path nulls `opted_in_at`. Document which wins. | *unverified* |
| **Low** | `providers/smsbrana.ts:155-159`, `whatsapp.ts:58-66` | **sec-03:** noop providers log the senior's E.164 phone and personal magic-link URL (`/q/{magic_token}`) to the server console (non-production only) | In preview/staging (`NODE_ENV !== production` but real-ish data), the `magic_token` — a full no-password auth capability for the senior account — is written to Vercel logs in plaintext alongside the phone. Anyone with log access can impersonate the senior. Gated to non-prod and the noop path. | Drop the magic-link URL and full phone from noop logs (channel + last-3-digits, omit `actionUrl`), or gate verbose noop logging behind an explicit debug flag. | *unverified* |
| Info | `providers/smsbrana.ts:37-38,131-136,181-192` | **sec-04:** Confirmed **NOT** vulnerable — secret leakage, SSRF, ReDoS, cron auth, RLS, param injection all handled correctly. Hosts are fixed constants; auth digest only on the wire; `extractTag` linear with 64 KB cap; `verifyCronAuth` timing-safe & fail-closed; RLS via `private.current_family_id()` with no write policy; `URLSearchParams` percent-encodes attacker-controlled `display_name`/`question`. | None — documenting the verified-safe surface. | No action. | — |

---

## Correctness / mistakes

The dispatch state machine, idempotency (unique `(assignment, channel)` key + irreversible-send asymmetry), and the cron's per-row isolation are well-built and well-tested. The real defects cluster around the **consent state machine** and the **noop providers**.

| Sev | Location | What | Impact | Fix | Verdict |
|---|---|---|---|---|---|
| **High** | `providers/smsbrana.ts:151-162`, `whatsapp.ts:55-67` | **corr-01:** noop providers in production mark SMS/WhatsApp sends as `'sent'` → question silently lost, never retried | `NoopSmsProvider.send` / `NoopWhatsAppProvider.send` return a synthetic id unconditionally (only the `console.log` is `NODE_ENV`-gated). `sendAndConfirm` only records `'failed'` when `send()` **throws**; a returned result writes `status='sent'`; the cron stamps `reminded_at`; the selection query filters `.is("reminded_at", null)` → never re-selected. No live-channel guard exists (`resolveDelivery` routes on channel+phone+opt-in only). SMS/WhatsApp are selectable in production **now** (`<option value="sms">`, `<option value="whatsapp">`), and the design ships Phase 1 with noop-in-production by intent. An owner who opts a senior into SMS before creds exist gets **permanent, silent question loss**. | Make noop a non-success in production: throw (→ `'failed'` + retry) when `NODE_ENV==='production'` and creds unset, **or** add `isLive` to `ChannelProvider` and have `resolveDelivery` fall back to email when the selected channel's provider isn't live. Never let a synthetic id stamp `reminded_at` in prod. | **✅ CONFIRMED** — every link in the causal chain present in code; refutation attempts failed. Owner must actively pick SMS/WhatsApp (email is the safe default), so it's an owner-triggered state, not universal loss. Severity held at **high**. |
| **Medium** | `lib/auth/senior-actions.ts:36-89` | **corr-02:** `updateSeniorProfile` (senior-card edit) re-enables SMS/WhatsApp on a **stale opt-in** with no fresh consent and no phone re-check | The update writes `contact_channel` but never touches `*_opted_in_at` / `phone_e164` / `*_opt_out_at` and never re-validates consent. Owner sets WhatsApp (opt-in stamped) → switches to email → switches back to WhatsApp: `resolveDelivery` sees opt-in set, opt-out null, phone present → dispatches with **no re-attestation**, defeating the "owner re-attests on every save" rule the delivery-form enforces. Compliance + correctness hazard under the attestation reframe. | Drop `whatsapp` from `updateSeniorProfile`'s enum and route all sms/whatsapp changes through `updateDeliverySettings`; **or** clear/require opt-in on entry/exit just like `updateDeliverySettings`. | *unverified — high confidence* |
| **Medium** | `senior-actions.ts:135-148` & `dispatch.ts:196-205` | **corr-03:** re-consent never clears a pre-existing opt-out → `resolveDelivery` falls back to email forever after any opt-out | On an sms/whatsapp save, `*_opted_in_at = now()` is stamped but `*_opt_out_at` is never reset; `resolveDelivery` only honors the channel when `optedIn && !optedOut`. Latent today (no opt-out writer), but the moment the **planned one-tap opt-out** ships, re-consent becomes a silent delivery no-op: fresh opt-in stamped, owner sees success, every dispatch silently demotes to email. A landmine shipped with the columns it concerns. | When stamping a fresh `*_opted_in_at`, null the matching `*_opt_out_at` in the same update (also fix in `createSeniorAccount`). Add now so it's correct the moment the opt-out path lands. | *unverified — high confidence* |
| **Medium** | `providers/smsbrana.ts:176-195` | **corr-04:** smsbrana send transmits diacritic UTF-8 with no `unicode`/`data_code` flag → likely garbled/"?" SMS body | `buildParams` sets `message: msg.text` (Czech with diacritics) but no encoding param. smsbrana's SMS Connect generally requires an explicit unicode flag for non-GSM-7 chars; without it the gateway commonly transliterates/replaces diacritics. `estimateSmsSegments` already assumes UCS-2, yet the wire request declares GSM-7. Live SMS could arrive mangled, with wrong segment billing. | Add the smsbrana unicode flag (confirm exact param name against live docs) when `msg.text` is non-GSM-7; align with the UCS-2 segment estimate. | *unverified — low confidence (depends on live API behavior); confirm before live send* |
| Low | `providers/smsbrana.ts:251-260` | **corr-05:** `Number()` parse of `sms_count`/`price` → comma-decimal or non-numeric body yields `NaN` written to typed DB columns | A Czech-locale decimal (`'1,50'`) or any non-numeric token → `NaN` into `segments` (smallint) / `price` (numeric). Either errors the post-send confirm UPDATE (swallowed → `'sent'`, acceptable) or persists a bad metric. The billed-segment count is the value the spec says to persist as authoritative. | Normalize comma decimals, guard `isFinite`, fall back to `undefined`. | *unverified* |
| Low | `delivery-form.tsx:174-177`, `add-senior-panel.tsx:401-407`, `lib/prompts/schedule.ts` | **corr-06:** `prompt_frequency='2'` (twice weekly, po+čt) is collected and stored but never honored | `planWeeklyQueue` never reads `prompt_frequency` (plans one/run); `vercel.json` schedules the cron Mondays only (`0 9 * * 1`). Owners who pick twice-weekly get once-weekly — a silent broken promise in the very UI this feature surfaces. Pre-existing, but the form is in scope. | Honor `prompt_frequency` in the planner + add a Thursday cron, **or** remove the twice-weekly option until wired. | *unverified — high confidence* |
| Low | `dispatch.ts:242-247, 354-359` | **corr-07:** idempotency SELECT discards `{ error }` — a transient read failure is treated as "no row" | On a transient SELECT error, `existing` is undefined → code proceeds to insert. Self-healing (the unique constraint forces the insert to fail, the catch re-fetches and re-checks `status==='sent'`, so no true double-send), but a blip silently downgrades the fast path to the unique-violation recovery path. Minor robustness gap. | Check the SELECT error; treat an errored read as "unknown — abort, retry next run", or at least log it. | *unverified* |
| Info | `lib/messaging/render.ts:97,130` | **corr-08:** SMS/WhatsApp wrapper uses mismatched quote glyphs (opening `„` U+201E, closing straight `"`); email uses the correct Czech pair. Cosmetic. | Inconsistent typographic quotes around the verbatim question. No functional defect. | Close with `„…"` (U+201C). | — |

---

## Optimization

Sequential per-row dispatch is **sound at the spec's hundreds-of-seniors/week scale** and should **not** be parallelized (concurrency would risk smsbrana rate limits and widen the accepted double-send window). The defects are the shared no-timeout issue and an N+1 that mirrors one already fixed for profiles.

| Sev | Location | What | Impact | Fix | Verdict |
|---|---|---|---|---|---|
| **Medium** | `providers/smsbrana.ts:197-213` (& `whatsapp.ts:99`) | **perf-01:** = sec-01 (no fetch timeout). | Once creds set, a hung response stalls a row up to 300 s and starves the batch; backup failover only fires on rejection, not a slow socket. | `AbortSignal.timeout(8000)` on both `post()` fetches; treat `AbortError` as transport failure so backup tries once. | *counted once with sec-01* |
| Low–Med | `dispatch.ts:242-247` | **perf-02:** idempotency SELECT is an N+1, bulk-prefetchable | One log SELECT per row (~one of ~4 serial round-trips/row); profiles were already batched in the cron but this stayed per-row. On a fresh batch every SELECT returns null — hundreds of avoidable serial round-trips/run. | Bulk-load log rows in the cron with `prompt_assignment_id IN (...)`, key a Map on `assignmentId+channel`, pass into `DispatchContext` so `dispatchPrompt` skips the leading SELECT (keep the race-recovery SELECT). Drops 3→2 round-trips/row. | *unverified — high confidence* |
| Low | `dispatch.ts:147-172` | **perf-03:** confirm-retry loop has no backoff | Retries the confirm UPDATE 1–3× with no delay, only when the DB already errored. Hammers the DB 3× inline per failing row. Can't resend, so a tail-latency nit. | `sleep(100*attempt)` on attempts 2–3. Optional. | *unverified* |
| Low | `route.ts:246-309` | **perf-04:** milestone pass is a **pre-existing** N+1 (per-book activity-log count + owner/senior SELECT, no batching) | Bounded (books full within 30 d, small cardinality) but shares the 300 s budget and compounds with perf-02. | If it grows, prefetch `full_notified` markers and batch profile lookups by `IN`. Not urgent. | *unverified* |
| Info | `route.ts:112-213` | **perf-05:** sequential design + per-row `reminded_at` stamp is **fine — do not add concurrency.** Renderers pure, `getProvider` a cached singleton. | None. ~4 serial round-trips/row + one send fits 300 s. | Keep sequential. Revisit `p-limit 5–10` + perf-02 prefetch only at low thousands. | — |

---

## Code length & UI loading-time

*(Full proof in the dedicated section above — repeated here only as the dimension's findings, all info/low as expected and stated honestly.)*

- **bundle perf-01 (info):** delivery layer is server-only, ships **0 bytes**; `/api/cron/weekly-reminder` is 183 B / 103 kB, identical to all API routes. *Suggestion:* add `import "server-only";` to `lib/messaging/types.ts` (the one file without it) to make the boundary self-enforcing — verified absent today, safe only because its importers are server-only.
- **bundle perf-02 (info):** only two client components changed; additions are trivial React, no heavy imports; `senior-card.tsx` is **not** modified.
- **bundle perf-03 (info):** the shared client helper `lib/validations/auth.ts` pulls in only `zod` (already bundled); the only inline data shipped is one ~90-char Czech sentence + a 2-item array.
- **bundle perf-04 (info):** affected route First Load JS (147 kB / 141 kB) is in-family with existing authenticated routes; no regression; shared chunk unchanged.
- **bundle perf-05 (info):** consent-persisting server actions are correctly `"use server"` + `server-only`; only the lightweight RPC stub ships.

---

## Code quality

On the whole **high quality**: a channel-agnostic abstraction that genuinely generalizes the email pattern, a consistent noop-provider convention across all three channels, a thorough security-conscious smsbrana provider, and a correctly DRYed irreversible-send seam. Types reused not re-declared; 45 tests pass. Smells are localized.

| Sev | Location | What | Impact | Fix | Verdict |
|---|---|---|---|---|---|
| **Medium** | `dispatch.ts:241-304` & `354-409` | **cq-01:** ~50 lines of idempotency-gate logic duplicated between `dispatchPrompt` and `dispatchOwnerFallback` (only the send/confirm **tail** was DRYed, not the upsert/race-recovery **head**) | Two copies of the subtlest concurrency logic (unique-violation race recovery, pending-reset) must stay in lockstep; a fix to one copy silently diverges the owner-fallback path — which is also the **least-tested** branch. The `sendAndConfirm` header comment claims the duplication was fixed "in both", but it wasn't. | Extract `upsertPendingLog(...)` and call from both, the way `sendAndConfirm` was extracted; `dispatchOwnerFallback` collapses to ~15 lines. | *unverified — high confidence* |
| Low | `validations/auth.ts:111`, `whatsapp.ts:140-143` | **cq-02:** dead exports — `CONSENT_CHANNELS` is exported but never imported; `whatsapp.ts` re-exports `renderWhatsApp` with a comment documenting a usage that doesn't exist | Dead public surface invites confusion about the intended import path. | Drop the `renderWhatsApp` re-export + comment; remove `CONSENT_CHANNELS` or make it load-bearing in `channelNeedsConsent`. | *unverified — high confidence* |
| Low | `types.ts:62`, `dispatch.ts:330-332`, migration `:36-38` | **cq-03:** comments promise behavior that doesn't exist — `SendResult.credit` is parsed and documented as driving "low-credit alerts" but has no consumer (parsed and dropped); the migration comment says "ON CONFLICT DO NOTHING" but the code does a plain insert + unique-violation recovery | A maintainer trusts a "low-credit alert path elsewhere" that doesn't exist and may mis-model the insert as conflict-swallowing. Misleading, not a runtime defect. | Downgrade credit comments to "captured for a future alert (not yet consumed)" or drop the field; fix the migration comment to describe insert-then-recover. | *unverified — high confidence* |
| Low | tests (gaps): `whatsapp.ts`, `email.ts`, `index.ts`, `dispatch.ts:345-431` | **cq-04:** uneven coverage — WhatsApp live provider, `EmailChannelProvider`, `renderEmail`, the `getProvider` registry, and the owner-fallback branch are untested (SMS has 17 tests) | The least-tested code (owner fallback, WhatsApp live send) is exactly where cq-01's duplication and the WhatsApp template mapping live. `EmailChannelProvider` and the owner-fallback path are **live now**. | Add a small providers test (EmailChannelProvider throws on missing subject/html, maps `ownerBcc→bcc`; WhatsApp builds template body & parses Meta error) + one dispatch test for the no-address→owner-fallback branch (reuse `stubFetch`). | *unverified — high confidence* |
| Low | `validations/auth.ts:91,115,131`; `senior-actions.ts:16,23`; `dispatch.ts:196-200` | **cq-05:** the `'sms'\|'whatsapp'` / channel enum is re-spelled in ~5 places; **real drift already exists** — `updateSchema` in `senior-actions` omits `'sms'` while `deliverySchema` includes it | Adding/removing a channel needs ~5 edits; the existing omission looks accidental (and ties into corr-02). | Confirm whether `updateSeniorProfile` intentionally excludes SMS; align if not. Derive the validation enums from the messaging `Channel` union / a shared const. | *unverified* |
| Low | `add-senior-panel.tsx:39-45` & `delivery-form.tsx:14-20` | **cq-06:** `normalizePhoneE164` copy-pasted verbatim into both forms (and the regex lives a third time in `phoneE164Schema`) | Two client copies can diverge from each other and from the server schema → inputs the client accepts but the server rejects. | Move to a shared `lib/validations/phone.ts`, import into both forms, reuse the schema's regex literal. | *unverified — high confidence* |
| Low | `render.ts:22-23,92,129`; `dispatch.ts:226,312` | **cq-07:** `RenderContext.ownerFirstName` actually receives a full name in one path and a first name in another; `firstName()` runs twice on the dispatch path | A `*FirstName` field whose doc says "full name", defended by an internal `firstName()`, is a naming trap; double-application reveals the inconsistency. | Pick one contract: rename to `ownerDisplayName` (renderers extract, dispatch stops pre-extracting) **or** keep `ownerFirstName` meaning a first name (renderers trust it). Update the doc. | *unverified* |
| Info | `providers/smsbrana.ts` | **cq-08:** the 278-line smsbrana provider is long but **justified** — DST-correct Prague time, ReDoS-safe XML extractor with size cap, transport-vs-status failover, err-code hints, E.164 normalization, each with a focused doc comment and a matching test. The model the rest of the feature should match. | None. | No change. | — |
| Info | `senior-card.tsx` | **cq-09:** the brief-listed `senior-card.tsx` is **not modified** (delivery UI lives in `add-senior-panel.tsx` + `delivery-form.tsx`). Noting so the absence isn't read as an oversight. | None. | Confirm whether a card change (surfacing channel/opt-out status) was intended and dropped. | — |

---

## What's well-built (credit)

- **The noop-provider pattern** — a consistent, build-safe convention across all three channels that makes the whole feature testable in preview without live credentials. (It is also the *source* of corr-01, but the pattern itself is the right call; the fix is a small liveness gate, not a redesign.)
- **The double-send fix** — the irreversible-send asymmetry (`sendAndConfirm` only records `'failed'` on a throw; a confirmed send is never resent) plus the unique `(assignment, channel)` key held up under adversarial probing of the idempotency invariant.
- **Server-only isolation** — six `import "server-only"` markers giving a build-enforced guarantee of **zero client-bundle cost** for the entire delivery layer, including the smsbrana provider and `node:crypto`.
- **Security fundamentals** — no secret leakage (test-asserted), no SSRF, ReDoS fixed and tested, fail-closed timing-safe cron auth, correct family-scoped RLS with service-role-only writes, and percent-encoded wire format immune to display-name/question injection.

---

## Prioritized punch-list

### P0 — fix before enabling live SMS/WhatsApp sends

1. **corr-01 (high, CONFIRMED) — noop-in-production silently loses questions.** Add `isLive` to `ChannelProvider` (or throw in prod when creds are unset) and fall back to email; never let a synthetic id stamp `reminded_at` in production. **Must land before SMS/WhatsApp are selectable in prod, independent of credential provisioning.**
2. **sec-01 / perf-01 (medium) — provider fetch has no timeout.** `AbortSignal.timeout(8000)` on both smsbrana and WhatsApp `post()` fetches; classify abort as a transport failure so the existing backup-host failover fires. **Required before any live send** — a single hung socket stalls the entire weekly batch.
3. **corr-04 (medium, confirm-then-fix) — smsbrana unicode flag for Czech diacritics.** Verify the exact param against live smsbrana docs and set it before the first real SMS, else seniors receive mangled text and wrong billing.

### P1 — fix before / alongside the consent→attestation reframe

- **corr-03 (medium) — re-consent must null the matching `*_opt_out_at`.** *Partially covered by the planned reframe* — the **opt-out write path** is planned, but the **reconciliation** (re-consent supersedes opt-out) is the new requirement this review surfaces; add it now so it's correct the moment the opt-out path lands. *(See also sec-02, the same defect from the security angle — one fix covers both.)*
- **corr-02 (medium) — `updateSeniorProfile` re-enables on stale opt-in.** *Adjacent to the attestation rename* (the "owner re-attests on every save" rule). Route sms/whatsapp through `updateDeliverySettings` or require fresh consent on entry. **Not** otherwise covered by the planned reframe.
- **cq-01 (medium) — DRY the duplicated idempotency-gate head** into `upsertPendingLog`. Independent of the reframe; reduces divergence risk in the least-tested branch.
- **cq-04 (low) — test the live-now paths** (`EmailChannelProvider`, owner-fallback branch) before they matter in production.
- **corr-06 (low) — twice-weekly cadence** is collected but never honored; either wire the Thursday cron or remove the option. Independent of the reframe.

*Already covered by the planned consent→attestation/legitimate-interest reframe (do not double-count): the **Art. 14 notice**, the **opt-out link** in messages, the **opt-out write path** (the writer for `*_opt_out_at`), and the **attestation rename** of the consent copy/columns. corr-03/sec-02 add only the reconciliation logic on top of that planned work.*

### P2 — nice-to-have / robustness & hygiene

- **perf-02 (low–med):** bulk-prefetch the idempotency log rows to drop the per-row N+1 (mirrors the profiles batch already done).
- **sec-03 (low):** strip phone + magic-link URL from noop logs (or gate behind a debug flag).
- **corr-05 (low):** defensive `isFinite` parse of `segments`/`price`.
- **corr-07 (low):** discarded SELECT error in the idempotency gate.
- **cq-02 / cq-03 / cq-05 / cq-06 / cq-07 (low):** dead exports, misleading comments, channel-enum drift (`updateSchema` omits `'sms'`), copy-pasted `normalizePhoneE164`, `ownerFirstName` naming trap.
- **bundle perf-01 (info):** add `import "server-only";` to `lib/messaging/types.ts` to make the client boundary self-enforcing.
- **corr-08 (info):** fix the mismatched closing quote glyph in the SMS/WhatsApp wrapper.
- **perf-03 / perf-04 (low/info):** confirm-retry backoff; pre-existing milestone-pass N+1 — only if it grows.
- **Keep the cron sequential (perf-05):** do not add concurrency at the current scale.

---

## Appendix — considered and dismissed (refuted)

*No findings were refuted in verification.* All high-severity findings submitted for adversarial verification (corr-01) were **confirmed** at their original severity. The remaining high/medium findings carry "unverified — high confidence" mechanism-inspected verdicts and were not refuted; they are retained above at their stated severities, not dismissed.
