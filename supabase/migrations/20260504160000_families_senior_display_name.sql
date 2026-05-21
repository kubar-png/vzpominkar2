-- M4: hold the senior's display name across the multi-step onboarding wizard.
alter table public.families
  add column senior_display_name text;

comment on column public.families.senior_display_name is
  'Owner enters this in step 1 of onboarding; reused in step 3 to populate the senior profile.display_name. May be null after senior is created.';
