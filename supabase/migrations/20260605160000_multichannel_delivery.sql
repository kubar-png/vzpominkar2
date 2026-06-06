-- Vzpomínkář — multi-channel question delivery (SMS + WhatsApp + email), Phase 1.
--
-- See docs/superpowers/specs/2026-06-05-multichannel-question-delivery-design.md.
-- Purely additive + idempotent (`if not exists`) so it is a safe no-op against
-- environments where parts already exist. No CHECK constraints on the new text
-- columns — value validation lives in lib/validations/auth.ts (mirrors the
-- existing contact_channel / contact_address convention; the live schema has no
-- CHECK there, so we don't diverge from it).

-- ---------------------------------------------------------------------------
-- profiles — per-senior channel routing + GDPR/ePrivacy consent bookkeeping.
--   phone_e164            normalized E.164 number for sms/whatsapp routing
--   sms_opted_in_at       when the owner opted the senior into SMS
--   whatsapp_opted_in_at  when the owner opted the senior into WhatsApp
--   sms_opt_out_at        in-app opt-out (CZ alphanumeric sender is one-way)
--   whatsapp_opt_out_at   in-app opt-out for WhatsApp
--   channel_consent_text  exact wording shown to the owner at opt-in, verbatim
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists phone_e164 text,
  add column if not exists sms_opted_in_at timestamptz,
  add column if not exists whatsapp_opted_in_at timestamptz,
  add column if not exists sms_opt_out_at timestamptz,
  add column if not exists whatsapp_opt_out_at timestamptz,
  add column if not exists channel_consent_text text;

-- contact_channel is widened to email|sms|whatsapp in the APP layer (Zod,
-- lib/validations/auth.ts). No DB CHECK is added here — the current schema
-- deliberately has none on contact_channel.

-- ---------------------------------------------------------------------------
-- prompt_delivery_log — one row per (assignment, channel) delivery attempt.
--
-- The unique (prompt_assignment_id, channel) pair is the idempotency key:
-- dispatchPrompt() inserts first with ON CONFLICT DO NOTHING, so a channel is
-- never sent twice for the same assignment. segments/price capture smsbrana's
-- per-send sms_count/price (observed, not estimated). The server owns every
-- write (service-role admin client, which bypasses RLS); owners only READ their
-- own family's rows (enables a future doručeno/nedoručeno dashboard).
-- ---------------------------------------------------------------------------
create table if not exists public.prompt_delivery_log (
  id uuid primary key default gen_random_uuid(),
  prompt_assignment_id uuid not null
    references public.prompt_assignments(id) on delete cascade,
  family_id uuid not null
    references public.families(id) on delete cascade,
  channel text not null,
  recipient_address text,
  provider text,
  provider_message_id text,
  segments smallint,                       -- smsbrana sms_count (billed parts)
  price numeric(10,2),                      -- smsbrana per-send price (CZK)
  status text not null default 'pending',   -- pending|sent|failed|skipped
  last_error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  unique (prompt_assignment_id, channel)     -- idempotency key
);

-- Lookups are by assignment (idempotency gate + per-assignment status surface).
create index if not exists prompt_delivery_log_assignment_idx
  on public.prompt_delivery_log (prompt_assignment_id);

-- ---------------------------------------------------------------------------
-- RLS — owner-read for their own family; writes are service-role only.
--
-- Mirrors the activity_log model (RLS enabled, a single family-scoped SELECT
-- policy, no write policy → all writes go through the service-role admin client
-- which bypasses RLS). Enabling RLS denies anon/authenticated by default.
-- ---------------------------------------------------------------------------
alter table public.prompt_delivery_log enable row level security;

drop policy if exists "delivery_log_select_family" on public.prompt_delivery_log;
create policy "delivery_log_select_family"
  on public.prompt_delivery_log for select to authenticated
  using (family_id = private.current_family_id());

comment on table public.prompt_delivery_log is
  'One row per (prompt_assignment, channel) delivery attempt. unique(prompt_assignment_id, channel) is the idempotency key. Owner-read for their own family; all writes are service-role only (no write policy).';
