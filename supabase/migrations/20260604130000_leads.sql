-- Lead-magnet emails from the marketing homepage. Persisted server-side (in
-- addition to the team notification email) so warm leads aren't lost if Resend
-- is down or unset. Service-role only: RLS on with NO policies — the
-- /api/leads route inserts via the admin client; nobody reads it via the API.

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  source text,
  created_at timestamptz not null default now()
);

alter table public.leads enable row level security;
