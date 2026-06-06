-- Vzpomínkář — attestation reframe: rename consent → attestation on profiles.
--
-- LEGAL REFRAME. The lawful basis for sending the weekly memory question to a
-- senior over SMS/WhatsApp is GDPR Art. 6(1)(f) **legitimate interest**, NOT
-- consent. The message is a SERVICE message (the family-initiated weekly
-- question the buyer paid for), not marketing. The senior is a third party
-- whose number the BUYER provides; the buyer cannot legally "consent on the
-- senior's behalf". What the owner CAN truthfully make is an **attestation**
-- (accountability evidence under Art. 5(2)): that they know the senior, have
-- the senior's agreement to use the number, and have informed the senior we
-- will send weekly questions there + how to opt out at any time.
--
-- Accordingly we rename the three "consent" columns to "attestation". The
-- *_opt_out_at columns are unchanged — the senior's Art. 21 right to object is
-- exercised via a one-tap opt-out link carried in every message (the CZ
-- alphanumeric sender is one-way, so "STOP" does not work — it is a link).
--
-- Renames (old → new):
--   profiles.channel_consent_text  -> profiles.channel_attestation_text
--   profiles.sms_opted_in_at       -> profiles.sms_attested_at
--   profiles.whatsapp_opted_in_at  -> profiles.whatsapp_attested_at
-- Unchanged: profiles.sms_opt_out_at, profiles.whatsapp_opt_out_at
--
-- IDEMPOTENT + GUARDED. The OLD columns are already applied to prod (see
-- 20260605160000_multichannel_delivery.sql). Each rename runs only if the old
-- column still exists, so re-running this migration — or running it against an
-- environment that has already been renamed — is a safe no-op. No data is
-- touched; a column rename preserves all existing values and the column type.

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'channel_consent_text'
  ) then
    alter table public.profiles
      rename column channel_consent_text to channel_attestation_text;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'sms_opted_in_at'
  ) then
    alter table public.profiles
      rename column sms_opted_in_at to sms_attested_at;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'whatsapp_opted_in_at'
  ) then
    alter table public.profiles
      rename column whatsapp_opted_in_at to whatsapp_attested_at;
  end if;
end $$;

comment on column public.profiles.channel_attestation_text is
  'Exact attestation wording shown to the owner at opt-in, stored verbatim. The owner attests (not "the senior consents") under GDPR Art. 5(2) accountability; lawful basis for sending is Art. 6(1)(f) legitimate interest.';
comment on column public.profiles.sms_attested_at is
  'When the owner made the SMS attestation (knows the senior, has agreement to use the number, informed the senior we will send weekly questions + opt-out).';
comment on column public.profiles.whatsapp_attested_at is
  'When the owner made the WhatsApp attestation (knows the senior, has agreement to use the number, informed the senior we will send weekly questions + opt-out).';
