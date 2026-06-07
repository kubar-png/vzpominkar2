-- Lead-magnet marketing consent (GDPR). The homepage e-mail-capture form now
-- carries a REQUIRED marketing-consent checkbox; we persist the visitor's
-- explicit consent alongside the lead so the opt-in is auditable: the exact
-- label text shown at the time of submission and when they ticked it.
--
-- Additive only (if not exists), service-role table — see 20260604130000_leads.sql.

alter table public.leads
  add column if not exists marketing_consent boolean not null default false;

alter table public.leads
  add column if not exists consent_text text;

alter table public.leads
  add column if not exists consent_at timestamptz;
