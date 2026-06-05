-- Vzpomínkář — upsell columns for print/gift orders + brown as the included cover.
--
-- Revenue add-ons (all priced via env, see lib/stripe/server.ts):
--   • copies      — number of printed copies. The FIRST copy is included in the
--                   base account price; each further copy is PRICE_BOOK_PRINT_EXTRA_CZK
--                   (a launch-only discount applies at the purchase moment).
--   • giftwrap    — gift wrapping + embossed dedication (PRICE_BOOK_GIFTWRAP_CZK).
--   • dedication  — free-text dedication printed/embossed when giftwrap is chosen.
-- The premium-cover surcharge is DERIVED (any cover_bg other than 'brown'),
-- so it needs no column.

alter table public.book_orders
  add column copies int not null default 1 check (copies >= 1),
  add column giftwrap boolean not null default false,
  add column dedication text;

alter table public.shop_orders
  add column copies int not null default 1 check (copies >= 1),
  add column giftwrap boolean not null default false,
  add column dedication text;

-- The included cover is now brown + gold (any non-brown colour is a paid upgrade).
-- Existing rows keep their stored colour; only the default for new books changes.
alter table public.books alter column cover_bg set default 'brown';
