-- Vzpomínkář — auto-scheduling safety net (owner-toggleable).
--
-- When ON (default), the weekly cron tops up a senior's queue with the next
-- prepared library question if the owner forgot to schedule one, so the
-- storytelling never stalls on an empty week. Owners who want full manual
-- control over every question can turn it off in /settings. Existing families
-- keep the current behaviour (default true).

alter table public.families
  add column auto_schedule_prompts boolean not null default true;
