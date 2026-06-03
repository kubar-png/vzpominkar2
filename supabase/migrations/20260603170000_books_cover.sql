-- Vzpomínkář — per-book cover customization ("přebal").
--
-- Background and text colour are chosen independently (see lib/book/cover.ts,
-- which the gift configurator, the dashboard cover picker and the exported PDF
-- cover all import so the options + hex values never drift). Persisted here so
-- the dashboard preview and the fulfilment PDF render the same cover.

alter table public.books
  add column cover_bg text not null default 'navy'
    check (cover_bg in ('brown', 'navy', 'red', 'gold')),
  add column cover_text text not null default 'gold'
    check (cover_text in ('black', 'gold', 'silver'));
