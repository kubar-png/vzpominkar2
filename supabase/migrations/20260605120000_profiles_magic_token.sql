-- Vzpomínkář — senior magic-link token.
--
-- A stable, high-entropy secret per account. The weekly reminder email links to
-- /q/{magic_token}; clicking it establishes the senior's Supabase session WITHOUT
-- a password (generateLink + verifyOtp, the same in-route session pattern as
-- /auth/callback) and drops them straight on this week's question. The family's
-- own /senior-login password is untouched.
--
-- Scope is limited to that one senior's answering surface (RLS still applies on
-- auth.uid()). Only the /q route for role='senior' consumes the token; owners get
-- one too (harmless — never used). Tokens are domain-independent, so switching to
-- the live domain only changes the URL prefix (built from SITE_URL), not the token.

create extension if not exists pgcrypto;

alter table public.profiles
  add column magic_token text;

-- Backfill existing rows with a 32-byte (64 hex char) secret.
update public.profiles
  set magic_token = encode(gen_random_bytes(32), 'hex')
  where magic_token is null;

-- New rows get one automatically.
alter table public.profiles
  alter column magic_token set default encode(gen_random_bytes(32), 'hex');

create unique index profiles_magic_token_key on public.profiles (magic_token);
