-- Vzpomínkář initial schema (M1)
-- All tables in public schema; RLS applied in a separate migration.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Helper: updated_at trigger function
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- families: one paying owner + one senior + their memories
-- ---------------------------------------------------------------------------
create table public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references auth.users on delete restrict,
  subscription_status text not null default 'trial'
    check (subscription_status in ('trial', 'active', 'expired', 'cancelled')),
  subscription_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index families_created_by_idx on public.families (created_by);

create trigger families_set_updated_at
  before update on public.families
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- profiles: owners and seniors both stored here, linked to auth.users
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  role text not null check (role in ('owner', 'senior')),
  family_id uuid references public.families on delete cascade,
  display_name text,
  username text unique,
  email text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_family_id_idx on public.profiles (family_id);
create index profiles_username_idx on public.profiles (username) where username is not null;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create unique index profiles_one_senior_per_family
  on public.profiles (family_id)
  where role = 'senior';

create unique index profiles_one_owner_per_family
  on public.profiles (family_id)
  where role = 'owner';

-- ---------------------------------------------------------------------------
-- prompts: question library (system prompts have family_id = null)
-- ---------------------------------------------------------------------------
create table public.prompts (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references public.families on delete cascade,
  category text,
  question text not null,
  order_index int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index prompts_family_id_idx on public.prompts (family_id);
create index prompts_category_idx on public.prompts (category);

-- ---------------------------------------------------------------------------
-- memories: a senior's answer (text + optional audio + attachments)
-- ---------------------------------------------------------------------------
create table public.memories (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families on delete cascade,
  prompt_id uuid references public.prompts on delete set null,
  author_id uuid not null references public.profiles on delete cascade,
  title text,
  text_content text,
  audio_path text,
  audio_duration_seconds int check (audio_duration_seconds is null or audio_duration_seconds >= 0),
  status text not null default 'draft' check (status in ('draft', 'published')),
  memory_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index memories_family_id_idx on public.memories (family_id);
create index memories_author_id_idx on public.memories (author_id);
create index memories_prompt_id_idx on public.memories (prompt_id);
create index memories_status_idx on public.memories (status);

create trigger memories_set_updated_at
  before update on public.memories
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- memory_attachments: photos + future media
-- ---------------------------------------------------------------------------
create table public.memory_attachments (
  id uuid primary key default gen_random_uuid(),
  memory_id uuid not null references public.memories on delete cascade,
  storage_path text not null,
  mime_type text not null,
  caption text,
  created_at timestamptz not null default now()
);

create index memory_attachments_memory_id_idx on public.memory_attachments (memory_id);

-- ---------------------------------------------------------------------------
-- prompt_assignments: scheduled weekly questions for the senior
-- ---------------------------------------------------------------------------
create table public.prompt_assignments (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families on delete cascade,
  prompt_id uuid not null references public.prompts on delete cascade,
  scheduled_for date not null,
  reminded_at timestamptz,
  answered_memory_id uuid references public.memories on delete set null,
  created_at timestamptz not null default now()
);

create index prompt_assignments_family_idx on public.prompt_assignments (family_id);
create index prompt_assignments_scheduled_idx on public.prompt_assignments (scheduled_for);

-- ---------------------------------------------------------------------------
-- book_orders: physical book purchases (placeholder in MVP)
-- ---------------------------------------------------------------------------
create table public.book_orders (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families on delete cascade,
  status text not null default 'draft'
    check (status in ('draft', 'paid', 'printing', 'shipped', 'delivered', 'cancelled')),
  shipping_address jsonb,
  stripe_payment_intent_id text unique,
  amount_czk int not null default 0 check (amount_czk >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index book_orders_family_idx on public.book_orders (family_id);

create trigger book_orders_set_updated_at
  before update on public.book_orders
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- activity_log: audit trail (mostly server-written)
-- ---------------------------------------------------------------------------
create table public.activity_log (
  id bigserial primary key,
  family_id uuid references public.families on delete cascade,
  actor_id uuid references public.profiles on delete set null,
  action text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index activity_log_family_idx on public.activity_log (family_id);
create index activity_log_actor_idx on public.activity_log (actor_id);
create index activity_log_created_idx on public.activity_log (created_at desc);

-- Note: RLS helpers (current_family_id, current_user_role) live in the
-- private schema and are created in a later migration (harden_security).
