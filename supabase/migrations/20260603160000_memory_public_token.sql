-- Public capability token for the QR memory-playback page (/v/{token}).
--
-- Each memory gets an opaque, unguessable token that the printed QR encodes.
-- Anyone with the book can open /v/{token} (no login) and play the recording;
-- the page mints a short-lived signed URL for the private audio server-side.
-- The token is STABLE FOREVER (it's printed) — never regenerate it.

alter table public.memories add column if not exists public_token text;

-- Backfill existing memories. 16 hex chars from a random UUID (~60 bits) —
-- URL-safe and no pgcrypto dependency.
update public.memories
  set public_token = substr(replace(gen_random_uuid()::text, '-', ''), 1, 16)
  where public_token is null;

-- New rows get a token automatically.
alter table public.memories
  alter column public_token set default substr(replace(gen_random_uuid()::text, '-', ''), 1, 16);

create unique index if not exists memories_public_token_key on public.memories (public_token);

comment on column public.memories.public_token is
  'Opaque capability token for the public QR playback page /v/{token}. Stable forever (printed in the book); never regenerate.';
