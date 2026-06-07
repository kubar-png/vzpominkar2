-- Vzpomínkář — discount coupons for checkout.
--
-- Owner enters a coupon code at checkout; the server validates it (active,
-- inside its validity window, under its redemption cap, valid for the product
-- being bought) and, on a successful purchase, records a redemption and
-- increments the coupon's running count so the owner can see how many people
-- bought via each code.
--
-- CODE CASING CONVENTION: codes are stored UPPERCASED. The validation lib
-- normalizes user input (trim + uppercase) before lookup, and a unique index on
-- `upper(code)` makes the uniqueness case-insensitive even if a row is inserted
-- by hand. Always write/read codes in upper case.

create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  -- Stored uppercased (see casing convention above).
  code text not null unique,
  -- Flat discount in CZK (we don't do percentage coupons yet).
  amount_off_czk int not null check (amount_off_czk > 0),
  -- Which product the discount applies to. A ProductType value
  -- (e.g. 'book_base') or the special value 'all' for any product.
  applies_to text not null default 'book_base',
  -- Optional validity window. NULL on either side = open-ended on that side.
  valid_from timestamptz,
  valid_until timestamptz,
  -- Optional cap on how many times the coupon can be redeemed. NULL = unlimited.
  max_redemptions int,
  -- Running tally of successful redemptions (incremented in recordRedemption).
  redeemed_count int not null default 0,
  active boolean not null default true,
  -- Free-form admin note (campaign, who it's for, …).
  note text,
  created_at timestamptz not null default now()
);

-- Case-insensitive uniqueness: even a hand-inserted lower-case row can't collide
-- with an existing upper-case code. The lib normalizes input to upper case.
create unique index if not exists coupons_upper_code_key
  on public.coupons (upper(code));

create table if not exists public.coupon_redemptions (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references public.coupons(id) on delete cascade,
  -- Who redeemed it (buyer email) — nullable for guest paths without an email.
  email text,
  -- A reference back to the order this redemption belonged to (shop_orders.id,
  -- books.id, or a Stripe session id — free-form so any purchase path can use it).
  order_ref text,
  -- The discount actually applied at the time (snapshotted, not a FK to amount).
  amount_off_czk int not null,
  -- The product the discount was applied to (a ProductType value).
  product_type text,
  redeemed_at timestamptz not null default now()
);

-- Per-coupon redemption history is the most common read.
create index if not exists coupon_redemptions_coupon_id_idx
  on public.coupon_redemptions (coupon_id);

-- ---------------------------------------------------------------------------
-- RLS — service-role only (mirrors public.leads and public.activity_log).
-- Enable RLS with NO policies so all anon / authenticated access is denied by
-- default. Every read and write goes through the service-role admin client
-- (lib/coupons/server.ts), which bypasses RLS. There is no public path.
-- ---------------------------------------------------------------------------
alter table public.coupons enable row level security;
alter table public.coupon_redemptions enable row level security;

comment on table public.coupons is
  'Checkout discount coupons. Codes stored uppercased; case-insensitive via unique index on upper(code). Service-role only — no anon/authenticated RLS policies.';
comment on table public.coupon_redemptions is
  'Successful coupon redemptions (one row per purchase). Service-role only — no anon/authenticated RLS policies.';

-- Seed the launch coupon. ON CONFLICT keeps re-apply safe (idempotent).
insert into public.coupons (code, amount_off_czk, applies_to, active, valid_until, note)
values ('VITEJTE200', 200, 'book_base', true, now() + interval '1 year', 'Launch welcome coupon')
on conflict (code) do nothing;
