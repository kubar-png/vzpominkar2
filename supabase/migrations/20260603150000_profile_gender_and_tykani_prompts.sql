-- profiles.gender — grammatical gender for Czech tykání in the questions a
-- senior is asked. Backfilled from senior_role (babička→female, dědeček→male …).
--
-- NOTE: the senior-facing prompt library is rewritten to tykání + "{masc|fem}"
-- tokens as a one-off data reconciliation run directly against each project
-- (prod's library had drifted to a larger set than supabase/seed.sql and reused
-- some order_index values, so an order_index-based UPDATE was unsafe). Fresh
-- installs get the tokenized text from the updated seed.sql.

alter table public.profiles
  add column if not exists gender text
    check (gender is null or gender in ('male', 'female'));

comment on column public.profiles.gender is
  'Grammatical gender for Czech address (tykání) in the questions the senior is asked. Owners may be null.';

update public.profiles set gender = 'female'
  where gender is null and senior_role in ('babicka', 'mama', 'prababicka', 'teta');
update public.profiles set gender = 'male'
  where gender is null and senior_role in ('dedecek', 'tata', 'pradedecek', 'stryc');
