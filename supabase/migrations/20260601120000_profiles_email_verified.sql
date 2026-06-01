-- Deferred email verification: owners now sign in immediately (no confirm
-- wall) and verify their email later, gated at the paywall. This flag tracks
-- whether the owner has proven control of their inbox by clicking an emailed
-- link. Seniors have no real email, so they are treated as verified.
alter table public.profiles
  add column if not exists email_verified boolean not null default false;

-- Backfill: every account that predates this flow keeps working untouched —
-- existing owners (incl. lifetime-free families) and all seniors are verified.
update public.profiles set email_verified = true where email_verified = false;
