-- Lock entitlement / financial tables from direct RLS writes (C1 + H1, M2).
--
-- Context: families, books and book_orders carry entitlement / financial
-- columns (subscription_status, paid, paid_at, amount_czk, …). The app NEVER
-- updates these tables through the RLS `createClient()` — every mutation goes
-- through the service-role admin client (markBookPaid, the Stripe webhook,
-- createPrintCheckout, refreshBookFullness). The owner UPDATE policies below
-- only existed so PostgREST + a logged-in owner's JWT could PATCH those
-- columns directly, bypassing Stripe. Dropping them removes that path while
-- leaving SELECT policies and `orders_insert_owner` (used by placeBookOrder
-- via RLS) intact.
--
-- Verified before writing this migration: there is no createClient()-based
-- `.update(`/`.insert(` against families / books / book_orders other than the
-- book_orders INSERT (orders_insert_owner). Service-role writes bypass RLS, so
-- the legitimate billing flows are unaffected.

-- C1 + H1 — drop the owner UPDATE policies on the entitlement / financial tables.
drop policy if exists "families_update_owner" on public.families;
drop policy if exists "books_update_owner" on public.books;
drop policy if exists "orders_update_owner" on public.book_orders;

-- M2 — prevent a senior/owner from re-pointing a memory at another volume
-- (memories.book_id) through the RLS UPDATE policy. All legitimate memory
-- writes go through the service-role admin client (saveTextMemory,
-- saveAudioMemory, savePhotoMemory, owner-actions, transcript-actions,
-- refreshBookFullness), which runs as the `service_role` and is exempt below.
-- A non-service-role caller may still edit their own memory (text, favourite,
-- etc.) but may not change which book it belongs to.
create or replace function private.lock_memory_book_id()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.role() <> 'service_role'
     and new.book_id is distinct from old.book_id then
    raise exception 'book_id can only be changed by the billing pipeline'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists memories_lock_book_id on public.memories;
create trigger memories_lock_book_id
  before update on public.memories
  for each row
  execute function private.lock_memory_book_id();
