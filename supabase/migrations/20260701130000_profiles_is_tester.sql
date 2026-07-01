-- Mark accounts created through the /testovani tester run so we can tailor UI
-- (and later analytics) to testers without affecting real users. Set true at
-- signup when the tester flag is present; defaults false for everyone else.

alter table public.profiles
  add column if not exists is_tester boolean not null default false;

comment on column public.profiles.is_tester is
  'True for accounts registered via the /testovani tester run (?test=1). Lets us show tester-only UI / filter analytics.';
