# Multi-channel question delivery (WhatsApp + SMS + email) — design

- **Date:** 2026-06-05
- **Status:** Design — awaiting owner review before implementation plan
- **Author:** owner (kubar) + Claude
- **Related memory:** [[weekly-question-loop]], [[senior-magic-link]], [[address-tykani-rule]], [[recipient-gender-feature]]

## 1. Goal

Today the weekly memory question reaches the senior **only by email** (Resend). Add **SMS** and **WhatsApp** as delivery channels, so a senior who doesn't read email still gets nudged. Each channel carries the **same notification — the asker, the question itself, and a magic link**; the senior taps it and records in the existing web app exactly as today.

## 2. Locked decisions

| Decision | Choice | Why |
|---|---|---|
| **Response model** | **A — link-only on every channel.** No in-chat voice replies. | Sidesteps the single riskiest part (inbound voice→which-question correlation, unauthenticated write path). Adversarial review independently recommended shipping link-only first. Voice-native is a **post-launch** experiment once we have real data. |
| **Phasing** | **SMS + email first; WhatsApp fast-follow.** | SMS via smsbrana is a quick API hookup; WhatsApp needs Meta Business Verification (multi-day). Don't let Meta block launch. |
| **SMS provider** | **smsbrana.cz from the start** (SMS Connect HTTP API). | Czech service, cheap, simple salted-hash API. Email stays Resend. |
| **SMS contains the question** | **Yes — the SMS includes the actual question text** (asker + question + link), not just "a new question". | Owner wants the senior to read the question right in the SMS. |
| **SMS diacritics** | **Keep diacritics** (Unicode SMS). | Owner prefers correct Czech over plain ASCII. With the question included this means several UCS-2 segments per SMS; cost is variable but small and **observed per-send** (smsbrana returns `sms_count` + `price`). |
| **Messenger** | **Dropped.** | Meta's 2026 tag deprecations leave no legal lane for an automated weekly proactive send; you can't message a user first; opt-in funnel is hostile to elderly users. Not built, not scaffolded. |
| **Voice-native WhatsApp replies** | **Deferred** (post-launch). | See response model. |
| **Per-senior fallback chain / status-driven demotion** | **Out of scope.** | YAGNI at hundreds of seniors. One channel per senior, chosen by the owner. |

## 3. Current state (grounded)

- **Cron:** `app/api/cron/weekly-reminder/route.ts` (Vercel cron `0 9 * * 1` = 09:00 UTC). It auto-plans the next question (`lib/prompts/schedule.ts:planWeeklyQueue`), loads due unanswered `prompt_assignments` (filter `reminded_at IS NULL`), gender-resolves the text (`resolveGender`), and for each row **hard-codes** the delivery:
  - resolves a `seniorEmail` (from `contact_address` when `contact_channel === "email"`, else the senior's real inbox), builds the magic link `${appUrl}/q/${magic_token}`, renders `weeklyReminderEmail(...)`, calls `sendEmail(...)`, then `update({ reminded_at })`.
  - The per-row block has **no try/catch** — one thrown send aborts the rest of the batch.
- **Provider pattern:** `lib/email/provider.ts` already abstracts delivery — `EmailProvider { send(msg): Promise<{id}> }` + a lazy `getEmailProvider()` returning a Noop provider when no key is set, Resend otherwise. **This is the exact shape we generalize.**
- **Existing columns** (`supabase/migrations/20260603120000_profiles_prompt_delivery_columns.sql`): `profiles.contact_channel` (`email|whatsapp`, app-enforced, no DB CHECK), `profiles.contact_address` (free text), plus `prompt_frequency ∈ {1,2}`. The `whatsapp` channel value is **stored but unused** — it silently falls through to email today.
- **Recording flow (unchanged by this work):** magic link `/q/{magic_token}` signs the senior in (no password) and lands them on the question; they record in-browser → existing upload + Whisper transcription pipeline.
- **Known gap:** email still sends `from: onboarding@resend.dev` (`TODO(domain)` in `provider.ts`) — apex domain not yet verified in Resend.

## 4. Target architecture

### 4.1 Messaging registry (`lib/messaging/`)

Generalize the email-provider pattern into a channel-agnostic registry.

```ts
// lib/messaging/types.ts
export type Channel = "email" | "sms" | "whatsapp";

export interface RenderedMessage {
  // Already channel-shaped by the renderer:
  subject?: string;     // email only
  html?: string;        // email only
  text: string;         // sms / whatsapp body, and email plaintext fallback
  tag?: string;
}

export interface DeliveryRecipient {
  channel: Channel;
  address: string;      // email | E.164 phone | wa_id
  ownerBcc?: string | null;
}

export interface ChannelProvider {
  readonly channel: Channel;
  send(to: DeliveryRecipient, msg: RenderedMessage): Promise<{ providerMessageId: string }>;
}

// lib/messaging/index.ts
export function getProvider(channel: Channel): ChannelProvider // lazy + noop fallback per channel
```

- **Email provider** wraps the existing `getEmailProvider()`/`sendEmail`.
- **SMS provider** = **smsbrana.cz SMS Connect HTTP API**; noop when the key is unset. Details:
  - Endpoint `https://api.smsbrana.cz/smsconnect/http.php` (fail over to `https://api-backup.smsbrana.cz/smsconnect/http.php`).
  - **Salted-hash auth** (never send the password): `time` = current timestamp, `sul` = random salt, `auth = md5(SMSBRANA_PASSWORD + time + sul)`; send `login`, `time`, `sul`, `auth`.
  - `action=send_sms`, `number` (E.164 without `+`, e.g. `420777…`), `message` (Unicode, diacritics kept), optional `sender_id` (registered branded sender), `delivery_report=1`.
  - Response is **XML**: `err` (0 = ok), `sms_id`, `sms_count` (segments billed), `price`, `credit` (remaining balance). `err != 0` → throw; otherwise persist `sms_count` + `price` to the delivery log and surface a **low-credit alert** when `credit` drops below a threshold.
- **WhatsApp provider** (fast-follow) calls Meta Cloud API `POST /{phone_number_id}/messages` with the approved **template** name + body variables; noop when unset.

### 4.2 The seam: `dispatchPrompt()`

Replace the hard-coded send block in the cron with one function:

```ts
// lib/messaging/dispatch.ts
export async function dispatchPrompt(admin, ctx: {
  assignmentId; familyId; senior; owner; question; appUrl;
}): Promise<{ status: "sent" | "skipped" | "failed"; channel; error? }>
```

Responsibilities:
1. **Resolve channel + address** from the senior profile (`contact_channel` + `phone_e164`/`contact_address`), with email as the implicit default. If no usable address → owner-fallback email (existing behaviour) → else skip.
2. **Render** the channel-appropriate message (§5).
3. **Idempotency gate:** insert `prompt_delivery_log (assignment_id, channel, …)` with `ON CONFLICT (assignment_id, channel) DO NOTHING`. If no row was inserted → already delivered on this channel → return `skipped`.
4. `getProvider(channel).send(...)` → update the log row `status='sent'`, `provider_message_id`.
5. On throw → log row `status='failed'`, `last_error` → return `failed` (the cron keeps going).

The cron loop calls `dispatchPrompt` inside a **per-row try/catch**, and sets `reminded_at` only when status is `sent` (semantics: *attempted-and-accepted*, not *delivered* — we have no delivery receipts in phase 1).

### 4.3 Why this shape

- One seam, one place to test. Channels are pure outbound swaps; the record/transcribe pipeline is **untouched**.
- The noop-provider pattern means the whole thing is testable locally and in preview **before** any real account exists (sends are logged, not transmitted).
- Adding WhatsApp later = drop in one provider + one renderer; no refactor of the cron.

## 5. Message copy (per channel)

**Every channel includes the actual question text** (asker + question + magic link). The *wrapper* is platform voice → **vykání**; the *embedded question itself* stays **tykání** — that's the family's voice (e.g. wrapper "Jakub má pro vás novou otázku:" + question „Vzpomeneš si na svůj první školní den?"). See [[address-tykani-rule]]. The question is gender-resolved for the senior via `resolveGender` (already done in the cron). [[recipient-gender-feature]]

- **Gender-neutral wrapper** to avoid needing the *owner's* gender: **"… má pro vás novou otázku"**, not "se vás zeptal/a".
- **Owner first name** (warmer than full name; the senior knows them).

| Channel | Body |
|---|---|
| **SMS** | `Jakub má pro vás novou otázku: „{otázka}" Odpověď nahrajete tady: {odkaz}` — Unicode; length scales with the question → typically ~3–4 UCS-2 segments. Cost is read back from `sms_count`/`price`. |
| **WhatsApp** (template, Utility) | `{{1}} má pro vás novou otázku: „{{2}}" Odpověď nahrajete tady: {{3}}` — vars: `{{1}}`=owner first name, `{{2}}`=question, `{{3}}`=magic link |
| **Email** | unchanged — existing `weeklyReminderEmail` rich template (already includes the question text) |

The magic link is the same `${appUrl}/q/${magic_token}` used today, so it works after the domain swap (reads from `SITE_URL`/`appUrl`).

## 6. Data model (additive migrations)

```sql
alter table public.profiles
  add column if not exists phone_e164 text,            -- normalized phone for sms/whatsapp
  add column if not exists sms_opted_in_at timestamptz,
  add column if not exists whatsapp_opted_in_at timestamptz,
  add column if not exists sms_opt_out_at timestamptz,
  add column if not exists whatsapp_opt_out_at timestamptz,
  add column if not exists channel_consent_text text;  -- exact wording shown to the owner at opt-in

-- contact_channel widened in the APP layer (Zod) to email|sms|whatsapp.
-- Defer a DB CHECK (current schema deliberately has none); validate in lib/validations.

create table if not exists public.prompt_delivery_log (
  id uuid primary key default gen_random_uuid(),
  prompt_assignment_id uuid not null references public.prompt_assignments(id) on delete cascade,
  family_id uuid not null references public.families(id) on delete cascade,
  channel text not null,
  recipient_address text,
  provider text,
  provider_message_id text,
  segments smallint,                         -- smsbrana sms_count (billed parts)
  price numeric(10,2),                       -- smsbrana per-send price (CZK)
  status text not null default 'pending',   -- pending|sent|failed|skipped
  last_error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  unique (prompt_assignment_id, channel)     -- idempotency key
);
```

- `phone_e164` validation lives in `lib/validations/*` (Zod regex `^\+[1-9]\d{1,14}$`); **backfill check**: confirm no current `whatsapp`-channel senior has an unnormalized number in `contact_address` before relying on `phone_e164`.
- `prompt_delivery_log` RLS: owner-read for their own family (enables a future "doručeno/nedoručeno" dashboard surface), admin-write.

## 7. Consent (GDPR / ePrivacy)

The senior is usually a **third party** the owner adds — the consenting party (owner) differs from the messaged party (senior). So:

- When the owner sets `contact_channel = sms | whatsapp` and enters a phone, the form requires a **consent checkbox** attesting *on the senior's behalf*. Draft wording (to be legal-reviewed), stored verbatim in `channel_consent_text` with the `*_opted_in_at` timestamp:
  > „Potvrzuji, že [jméno seniora] souhlasí se zasíláním otázek na uvedené telefonní číslo přes SMS / WhatsApp."
- **Forms to touch:** `app/(app)/family/[familyId]/rodina/add-senior-panel.tsx` and `app/(app)/settings/otazky/delivery-form.tsx` (both currently collect channel + address with **zero** consent fields).
- **Opt-out:** the CZ alphanumeric sender is one-way (can't receive "STOP"), so opt-out is **in-app** — owner switches the channel back to email in settings, and the `/q` landing offers "přestat posílat SMS/WhatsApp". Sets `*_opt_out_at`; the dispatch query filters opted-out channels.

## 8. Reliability fixes (do regardless of channel)

1. **Per-row try/catch** in the cron loop — latent bug today (one failed email aborts the batch); acute with network providers.
2. **Idempotency** via `prompt_delivery_log` unique `(assignment_id, channel)` as the first write (`ON CONFLICT DO NOTHING`); derive `reminded_at` from a successful dispatch, not a parallel mechanism.
3. **SMS length guard** — the body now carries the (variable-length) question, so don't truncate the question itself, but **always preserve the link**, and log/alert when a rendered SMS would exceed a sane cap (e.g. > 5 UCS-2 segments) so an abnormally long library question can't silently run up cost. Actual cost is observed per-send via smsbrana's `sms_count`/`price`.
4. **Cron time / DST** — `0 9 * * 1` UTC = 10:00 CET / 11:00 CEST. Both land mid-morning Prague → acceptable for SMS; **document** that Vercel cron is UTC-only and drifts ±1h with DST. No change needed now.

## 9. External provisioning (Phase 0 — owner track, gates go-live not code)

1. **smsbrana.cz** (Phase 1 — quick): create the account, top up **credit**, enable **SMS Connect** with **"Advanced login"** (gives login + the salted-hash auth). Default smsbrana sender works immediately; a **branded `sender_id` "Vzpomínkář"** can be registered separately (custom alphanumeric senders need approval, but we can ship on the default sender first). Not a blocker.
2. **WhatsApp (Phase 2 — longest pole):** Meta Business Verification + WhatsApp Business Account + a **clean dedicated phone number** (must NOT already be in the consumer WhatsApp app) + submit the **Utility template** (§5). Start this in parallel with Phase 1.
3. **Finish Resend apex-domain verification** so email leaves `onboarding@resend.dev` (existing TODO).

Env vars (noop until set): `SMSBRANA_LOGIN`, `SMSBRANA_PASSWORD`, optional `SMSBRANA_SENDER_ID`; later `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_TEMPLATE_NAME`.

## 10. Phasing

- **Phase 0 (owner, parallel):** kick off §9 provisioning.
- **Phase 1 (build now — no external gate):** `lib/messaging` registry + email provider wrap; `dispatchPrompt` seam + per-row try/catch + `prompt_delivery_log`; SMS provider + renderer; data-model migration; consent UI + opt-out; widen `contact_channel`. Ships SMS + email; fully testable via noop providers in preview.
- **Phase 2 (fast-follow, when Meta clears):** WhatsApp provider + approved template; flip `whatsapp` channel live. No cron refactor.
- **Post-launch (separate spec):** voice-native WhatsApp replies (inbound webhook, media download, phone→senior + which-assignment correlation, unauthenticated memory write).

## 11. Testing

- Unit: renderers (SMS length/charset, gender-neutral copy), `dispatchPrompt` channel resolution + idempotency (`ON CONFLICT`), opt-out filtering.
- Integration: cron batch with a forced provider throw → asserts the rest of the batch still sends (per-row isolation) and the failed row logs `failed` without setting `reminded_at`.
- Manual/preview: noop providers log intended sends; verify magic link + copy per channel.

## 12. Out of scope / deferred

Voice-native inbound (all channels); Facebook Messenger; per-senior fallback chain + delivery-receipt webhooks + status-driven channel demotion; owner-facing delivery dashboard beyond the data being captured.

## 13. Open questions / risks

- **SMS cost** is now variable (question text + diacritics → typically ~3–4 UCS-2 segments ≈ low single-digit Kč per send at smsbrana volume rates). It's **observed**, not estimated — log `sms_count`/`price` per send and alert when smsbrana `credit` runs low. Prepaid credit means a send fails if the balance hits zero → the low-credit alert is a launch requirement, not a nicety.
- **WhatsApp cost** swings ~4× on Meta's Utility vs Marketing categorization, only known after approval — budget for Marketing; file a category review within 60 days if needed. Treat every weekly send as a paid business-initiated conversation (the "free 24h window" doesn't apply to proactive sends).
- **WhatsApp reach** among *our* seniors is unknown — drives whether SMS or WhatsApp is the real primary channel.
- **Clean WhatsApp number** availability decides direct Cloud API vs a BSP (360dialog) with a pre-verified number.
- **Unverified WhatsApp tier** caps at 250 business-initiated conversations/day — fine at current scale; confirm before growth.
