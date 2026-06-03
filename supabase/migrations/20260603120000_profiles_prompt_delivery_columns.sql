-- Adds the prompt-delivery columns on public.profiles that the app already
-- reads/writes (lib/auth/actions.ts, lib/auth/senior-actions.ts,
-- app/api/cron/weekly-reminder, the rodina + otázky surfaces) and that exist in
-- the live database + types/database.ts, but were never captured as a
-- migration. Without this, a clean `supabase db reset` / fresh CI / staging
-- environment is missing these columns and those code paths fail at runtime.
--
-- Definitions mirror the live DB and the Zod contract in lib/validations/auth.ts:
--   prompt_frequency ∈ {1,2}, default 1, NOT NULL
--   contact_channel  ∈ {email,whatsapp} or NULL   (enforced in the app layer)
--   contact_address  free text (≤200 enforced in the app), or NULL
--
-- Purely additive + idempotent (`if not exists`), so it is a safe no-op against
-- the live DB where these columns already exist. No CHECK constraints are added
-- here so the migration reproduces (not diverges from) the current live schema;
-- value validation lives in lib/validations/auth.ts.

alter table public.profiles
  add column if not exists prompt_frequency smallint not null default 1,
  add column if not exists contact_channel text,
  add column if not exists contact_address text;
