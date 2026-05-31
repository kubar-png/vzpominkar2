-- Acquisition attribution: how the owner heard about Vzpomínkář. Asked once,
-- right after the first (base) purchase. Nullable — null = not answered yet.
alter table public.families
  add column referral_source text
    check (
      referral_source is null
      or referral_source in ('social', 'google', 'ai', 'friend', 'media', 'other')
    );
