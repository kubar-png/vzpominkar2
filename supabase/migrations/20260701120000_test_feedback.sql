-- Vzpomínkář — tester feedback ("/testovani" Typeform-style survey).
--
-- Captures structured answers from the private tester run: an NPS score, a few
-- ease/value scales, willingness-to-pay ranges, business-model preference, and
-- free-text notes (see lib/feedback/questions.ts). Answers land here via the
-- submitFeedback server action, which writes with the service-role admin client.
--
-- profile_id links the response to a logged-in owner when we have one (null for
-- anonymous testers, or set null if that profile is later deleted). contact_email
-- is an optional opt-in ("pozvěte mě mezi první uživatele"); meta holds any
-- lightweight context (progress snapshot, referrer, …).
--
-- Service-role only: RLS is enabled with NO policies. Every write goes through
-- the admin client (submitFeedback), which bypasses RLS; nobody reads this table
-- back via the API. Enabling RLS with no policies denies all anon /
-- authenticated access by default (defence in depth — there is no public path).

create table if not exists public.test_feedback (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  profile_id uuid references public.profiles(id) on delete set null,
  answers jsonb not null,
  contact_email text,
  meta jsonb
);

alter table public.test_feedback enable row level security;

comment on table public.test_feedback is
  'Tester feedback from the /testovani survey. Service-role only — no anon/authenticated RLS policies; all writes go through the submitFeedback server action via the admin client.';
