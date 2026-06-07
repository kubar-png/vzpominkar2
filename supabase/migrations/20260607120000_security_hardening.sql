-- Vzpomínkář — security hardening (launch-blockers K2 + RLS narrowing).
--
-- Three fixes, all in the "principle of least privilege" family:
--
-- 1) profiles column lockdown (CRITICAL — account-takeover + cross-tenant).
--    The row policy `profiles_select_self_or_family` lets ANY family member
--    (including a senior, who logs in with an 8-char password) read EVERY
--    column of EVERY profile in the family — including `magic_token` (a stable
--    no-password login secret consumed at /q/{token}) and `phone_e164` (PII).
--    A curious/malicious senior could read the owner's magic_token via the anon
--    REST API and take over the account. Separately, `profiles_update_self`
--    (`with check id = auth.uid()`) lets a senior rewrite their OWN `family_id`
--    to another family's UUID and read that family's memories (cross-tenant).
--
--    RLS is row-level, so neither can be fixed by a policy alone. We restrict
--    at the column-privilege layer instead:
--      - REVOKE blanket table privileges from anon/authenticated.
--      - GRANT SELECT only on the NON-secret columns (every legitimate read of
--        the secret columns already goes through the service-role admin client,
--        which bypasses grants — verified across the codebase).
--      - GRANT UPDATE only on `display_name` (the single column a user-client
--        action writes — lib/auth/profile-actions.ts:updateDisplayName). This
--        closes the family_id / role / magic_token self-escalation: everything
--        else is written by the admin client.
--    FAIL-SAFE: any future column is hidden from the API by default until it is
--    explicitly granted here — a new secret can't silently leak.
--
--    The `private.current_family_id()` / `current_user_role()` helpers are
--    SECURITY DEFINER (run as their owner), so they keep reading profiles for
--    every RLS policy regardless of these grants.
--
-- 2) magic_token rotation. Clean-slate: any token a snooping senior could have
--    already scraped becomes useless. Pre-launch volume is ~0, so the only cost
--    is that not-yet-clicked /q and /odhlasit links in already-sent messages
--    stop working (the senior can still use /senior-login; the next weekly
--    message carries a fresh link).
--
-- 3) RLS narrowing:
--    - prompt_delivery_log: owner-only SELECT (was family-wide → a senior could
--      read their own phone + delivery metadata over REST).
--    - families INSERT: require role='owner' (the app creates families via the
--      admin client; this just denies a senior creating orphan families via REST).

-- ---------------------------------------------------------------------------
-- 1) profiles — column-level privilege lockdown
-- ---------------------------------------------------------------------------
revoke select, insert, update, delete on public.profiles from anon, authenticated;

-- Non-secret columns the authenticated role may read (family members can still
-- see each other's basic profile). The 7 omitted columns — magic_token,
-- phone_e164, channel_attestation_text, sms_attested_at, whatsapp_attested_at,
-- sms_opt_out_at, whatsapp_opt_out_at — are readable only via the admin client.
grant select (
  avatar_url,
  birth_year,
  contact_address,
  contact_channel,
  created_at,
  display_name,
  email,
  email_verified,
  family_id,
  gender,
  id,
  is_senior,
  prompt_frequency,
  role,
  senior_role,
  updated_at,
  username
) on public.profiles to authenticated;

-- The only column a user-client action writes (display-name form). family_id,
-- role, magic_token, phone, etc. are admin-only → no self-escalation.
grant update (display_name) on public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- 2) Rotate every magic token (one-time clean slate)
-- ---------------------------------------------------------------------------
update public.profiles
  set magic_token = encode(gen_random_bytes(32), 'hex');

-- ---------------------------------------------------------------------------
-- 3a) prompt_delivery_log — owner-only read (was family-wide)
-- ---------------------------------------------------------------------------
drop policy if exists "delivery_log_select_family" on public.prompt_delivery_log;
drop policy if exists "delivery_log_select_owner" on public.prompt_delivery_log;
create policy "delivery_log_select_owner"
  on public.prompt_delivery_log for select to authenticated
  using (
    family_id = private.current_family_id()
    and private.current_user_role() = 'owner'
  );

-- ---------------------------------------------------------------------------
-- 3b) families — only owners may INSERT (app uses the admin client regardless)
-- ---------------------------------------------------------------------------
drop policy if exists "families_insert_owner" on public.families;
create policy "families_insert_owner"
  on public.families for insert to authenticated
  with check (
    created_by = auth.uid()
    and private.current_user_role() = 'owner'
  );
