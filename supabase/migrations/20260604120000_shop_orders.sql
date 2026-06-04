-- Vzpomínkář — guest gift-book orders ("Kniha vzpomínek", /kniha/sestavit).
--
-- The gift book is a SEPARATE product from the in-app print book (book_orders):
-- it's bought by a guest with NO account, configured entirely client-side
-- (questions + recipient gender + cover design live in localStorage), and paid
-- via Stripe guest checkout (or the free path while Stripe-live waits on the
-- domain — PRE-LAUNCH #4). The server owns this table end-to-end; guests never
-- read it back, so RLS is enabled with NO policies (service-role only).

create table public.shop_orders (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'draft'
    check (status in ('draft', 'paid', 'fulfilled', 'cancelled')),
  -- Buyer (the person paying / to be contacted). Nullable so a draft can be
  -- created before validation hardens, but the server always supplies them.
  buyer_name text,
  buyer_email text,
  -- Recipient grammatical gender — drives how the printed questions address them.
  recipient_gender text check (recipient_gender in ('male', 'female')),
  -- Cover design (see lib/book/cover.ts). Stored as the option *values*.
  cover_bg text,
  cover_text text,
  -- The assembled selection: Record<phaseKey, {id,text,custom?}[]>.
  questions jsonb not null,
  -- Delivery address (free-form jsonb: name, street, city, zip, …).
  shipping_address jsonb,
  amount_czk int check (amount_czk is null or amount_czk >= 0),
  currency text not null default 'czk',
  stripe_session_id text,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

-- Looked up by the Stripe webhook on checkout.session.completed.
create unique index shop_orders_stripe_session_id_key
  on public.shop_orders (stripe_session_id)
  where stripe_session_id is not null;

-- ---------------------------------------------------------------------------
-- RLS — service-role only. Guests don't read their order back; every read and
-- write goes through the service-role admin client (order-actions + webhook),
-- which bypasses RLS. Enabling RLS with NO policies denies all anon /
-- authenticated access by default (defence in depth — there is no public path).
-- ---------------------------------------------------------------------------
alter table public.shop_orders enable row level security;

comment on table public.shop_orders is
  'Guest gift-book orders for the Kniha vzpomínek configurator (/kniha/sestavit). Service-role only — no anon/authenticated RLS policies. Separate from book_orders (the in-app print book).';
