-- Vzpomínkář — gift vouchers (dárkový poukaz).
--
-- The gift flow (/darovat) lets a buyer personalize a printable A5-landscape
-- voucher — a brand-coloured card with the two-line message "Zajímá mě tvůj
-- příběh. / Proto jsem ti koupil{a} Vzpomínkář." — that they hand to the
-- recipient. The voucher PDF is rendered by the same headless-Chromium pipeline
-- as the print book (Puppeteer → /print/voucher/[token]), guarded by an HMAC
-- print token. The PDF is only downloadable AFTER payment (no free vouchers),
-- so each voucher tracks whether the matching order has been paid.
--
-- SERVICE-ROLE ONLY: RLS is enabled with NO policies (same pattern as `leads`
-- and `coupons`). Every read/write goes through the admin client in
-- lib/gift/voucher.ts; nothing reaches this table via the anon/auth API. The
-- unguessable high-entropy `token` is the only capability that names a row.

create table if not exists public.gift_vouchers (
  id uuid primary key default gen_random_uuid(),
  -- Unguessable high-entropy hex handle for this voucher (32 random bytes →
  -- 64 hex chars), the same shape as profiles.magic_token. Used as the public
  -- identifier on the confirmation page and signed into the HMAC print token.
  token text not null unique default encode(gen_random_bytes(32), 'hex'),
  -- Which product the voucher accompanies. A gift-flow ProductType value:
  --   'book_base'            — app access + printed book (the primary product)
  --   'shop_book_standard'   — the pre-filled fill-in book
  --   'shop_book_custom'     — the write-your-own-questions custom book
  product_type text not null,
  -- Chosen brand colour — a CoverBg value ('brown' | 'navy' | 'red' | 'gold'),
  -- reusing the cover palette (lib/book/cover.ts). Defaults to navy.
  color text not null default 'navy',
  -- Optional recipient oslovení (e.g. "Milá babičko") rendered on the card.
  recipient text,
  -- Optional personal message line shown under the fixed two-line message.
  message text,
  -- Optional buyer signature (e.g. "Tvůj vnuk Honza").
  signed_by text,
  -- Whether the order behind this voucher has been paid. The PDF render route
  -- refuses to mint a download for an unpaid voucher (no free vouchers).
  paid boolean not null default false,
  -- A free-form reference back to the order this voucher belongs to
  -- (shop_orders.id, books.id, or a Stripe session id — any purchase path).
  order_ref text,
  created_at timestamptz not null default now()
);

alter table public.gift_vouchers enable row level security;
