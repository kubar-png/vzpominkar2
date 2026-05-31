-- Year of birth for seniors (no full date — just the year) so we can do
-- usage analytics by age cohort. Nullable: existing seniors have none; the
-- add-senior form collects it for new ones.
alter table public.profiles
  add column birth_year smallint
    check (birth_year is null or (birth_year >= 1900 and birth_year <= 2100));
