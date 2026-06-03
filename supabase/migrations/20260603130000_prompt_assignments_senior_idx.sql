-- Index for the hottest per-senior path. prompt_assignments.senior_id was added
-- in 20260505140000 without an index, but it is the dominant filter for:
--   - the senior home page (due + upcoming queries),
--   - prompt scheduling (lib/prompts/actions.ts),
--   - the weekly-reminder cron,
--   - the RLS policy `assignments_select_owner_or_senior` (evaluated on every read).
-- Composite (senior_id, scheduled_for) also serves the `order by scheduled_for`
-- on the home-page due/upcoming queries.

create index if not exists prompt_assignments_senior_scheduled_idx
  on public.prompt_assignments (senior_id, scheduled_for);
