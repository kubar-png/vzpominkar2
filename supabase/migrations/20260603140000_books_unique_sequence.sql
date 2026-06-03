-- Prevent duplicate volumes created by concurrent checkout submits (double-click,
-- Stripe back-button, retried form POST). The natural key of a volume is
-- (family_id, senior_id, sequence_no).
--
-- senior_id is nullable (the base book is created before the senior's auth
-- profile exists), so NULLS NOT DISTINCT is required — otherwise two base books
-- (senior_id IS NULL, sequence_no = 1) would not be considered duplicates.
-- Requires Postgres 15+ (this project is).
--
-- The checkout actions (startBaseCheckout / startVolumeCheckout) handle the
-- resulting 23505 by reusing the existing row instead of erroring.
--
-- NOTE: if applied to an already-populated DB that the duplicate-book bug has
-- already affected, dedupe first (keep one row per family_id, senior_id,
-- sequence_no) — index creation fails on pre-existing duplicates.

create unique index if not exists books_family_senior_sequence_uniq
  on public.books (family_id, senior_id, sequence_no)
  nulls not distinct;
