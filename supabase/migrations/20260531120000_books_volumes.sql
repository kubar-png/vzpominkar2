-- Vzpomínkář — one-time purchase model: "books" (volumes).
--
-- The paid unit is a BOOK (volume / "díl"): one collection of up to 52
-- processed prompts about one senior. A senior can have multiple books
-- (Díl 1, Díl 2, …). Purchases are one-time and lifetime — no expiry,
-- no subscription. Base purchase = first book; add-on = a new senior's
-- first book OR a further volume for an existing senior.

-- ---------------------------------------------------------------------------
-- books
-- ---------------------------------------------------------------------------
create table public.books (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families on delete cascade,
  -- The senior this book is about. Nullable because the base book can be
  -- created before the senior's auth profile exists (onboarding step 2).
  senior_id uuid references public.profiles on delete set null,
  -- Snapshot of the senior's name so the volume survives profile edits.
  senior_display_name text,
  -- Volume number for the same senior: Díl 1, Díl 2, …
  sequence_no int not null default 1 check (sequence_no >= 1),
  title text,
  -- Hard content cap: at most this many prompts are processed into the book.
  prompt_cap int not null default 52 check (prompt_cap > 0),
  status text not null default 'collecting'
    check (status in ('collecting', 'full', 'ordered', 'printed')),
  -- One-time payment, lifetime. paid=false means "awaiting payment".
  paid boolean not null default false,
  paid_at timestamptz,
  stripe_payment_intent_id text unique,
  amount_czk int not null default 0 check (amount_czk >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index books_family_id_idx on public.books (family_id);
create index books_senior_id_idx on public.books (senior_id);

create trigger books_set_updated_at
  before update on public.books
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Link prompts / memories / print orders to a book
-- ---------------------------------------------------------------------------
alter table public.prompt_assignments
  add column book_id uuid references public.books on delete cascade;
alter table public.memories
  add column book_id uuid references public.books on delete set null;
alter table public.book_orders
  add column book_id uuid references public.books on delete set null;

create index prompt_assignments_book_id_idx on public.prompt_assignments (book_id);
create index memories_book_id_idx on public.memories (book_id);
create index book_orders_book_id_idx on public.book_orders (book_id);

-- ---------------------------------------------------------------------------
-- RLS — family members read; owners manage (mirrors families/memories model)
-- ---------------------------------------------------------------------------
alter table public.books enable row level security;

create policy "books_select_family"
  on public.books for select to authenticated
  using (family_id = private.current_family_id());

create policy "books_insert_owner"
  on public.books for insert to authenticated
  with check (family_id = private.current_family_id() and private.current_user_role() = 'owner');

create policy "books_update_owner"
  on public.books for update to authenticated
  using (family_id = private.current_family_id() and private.current_user_role() = 'owner')
  with check (family_id = private.current_family_id() and private.current_user_role() = 'owner');

-- ---------------------------------------------------------------------------
-- Backfill: every existing family becomes one paid, lifetime book (Díl 1).
-- These are test families — grandfather them in for free.
-- ---------------------------------------------------------------------------
insert into public.books
  (family_id, senior_id, senior_display_name, sequence_no, title, status, paid, paid_at, amount_czk)
select
  f.id,
  (select p.id from public.profiles p
     where p.family_id = f.id and p.role = 'senior'
     order by p.created_at limit 1),
  f.senior_display_name,
  1,
  'Díl 1',
  'collecting',
  true,
  now(),
  0
from public.families f;

update public.prompt_assignments pa
  set book_id = b.id
  from public.books b
  where b.family_id = pa.family_id and pa.book_id is null;

update public.memories m
  set book_id = b.id
  from public.books b
  where b.family_id = m.family_id and m.book_id is null;

update public.book_orders bo
  set book_id = b.id
  from public.books b
  where b.family_id = bo.family_id and bo.book_id is null;

-- Lifetime access for the grandfathered families (no expiry).
update public.families
  set subscription_status = 'active',
      subscription_expires_at = null;
