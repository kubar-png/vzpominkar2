-- Vzpomínkář — RLS helpers, policies, storage buckets and storage policies (M1).
--
-- Helpers live in the `private` schema so they aren't exposed via PostgREST RPC.
-- RLS model:
--   owner  = full read/write within own family
--   senior = read within own family; write only own memories
--   anon   = no access (except public avatars bucket via direct URL)

-- ---------------------------------------------------------------------------
-- Private schema + RLS helpers (security definer)
-- ---------------------------------------------------------------------------
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.current_family_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select family_id from public.profiles where id = auth.uid()
$$;

create or replace function private.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

revoke all on function private.current_family_id() from public, anon, authenticated;
revoke all on function private.current_user_role() from public, anon, authenticated;

-- Pin trigger fn search_path (defensive against role-mutable warnings).
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Enable RLS on every public table
-- ---------------------------------------------------------------------------
alter table public.families            enable row level security;
alter table public.profiles            enable row level security;
alter table public.prompts             enable row level security;
alter table public.memories            enable row level security;
alter table public.memory_attachments  enable row level security;
alter table public.prompt_assignments  enable row level security;
alter table public.book_orders         enable row level security;
alter table public.activity_log        enable row level security;

-- ---------------------------------------------------------------------------
-- Policies — public schema tables
-- ---------------------------------------------------------------------------
-- families
create policy "families_select_members"
  on public.families for select to authenticated
  using (id = private.current_family_id());

create policy "families_insert_owner"
  on public.families for insert to authenticated
  with check (created_by = auth.uid());

create policy "families_update_owner"
  on public.families for update to authenticated
  using (id = private.current_family_id() and private.current_user_role() = 'owner')
  with check (id = private.current_family_id() and private.current_user_role() = 'owner');

-- profiles
create policy "profiles_select_self_or_family"
  on public.profiles for select to authenticated
  using (id = auth.uid() or family_id = private.current_family_id());

create policy "profiles_update_self"
  on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- prompts (system prompts have family_id is null and are world-readable to authenticated)
create policy "prompts_select_system_or_family"
  on public.prompts for select to authenticated
  using (family_id is null or family_id = private.current_family_id());

create policy "prompts_insert_owner"
  on public.prompts for insert to authenticated
  with check (family_id = private.current_family_id() and private.current_user_role() = 'owner');

create policy "prompts_update_owner"
  on public.prompts for update to authenticated
  using (family_id = private.current_family_id() and private.current_user_role() = 'owner')
  with check (family_id = private.current_family_id() and private.current_user_role() = 'owner');

create policy "prompts_delete_owner"
  on public.prompts for delete to authenticated
  using (family_id = private.current_family_id() and private.current_user_role() = 'owner');

-- memories
create policy "memories_select_family"
  on public.memories for select to authenticated
  using (family_id = private.current_family_id());

create policy "memories_insert_family_member"
  on public.memories for insert to authenticated
  with check (family_id = private.current_family_id() and author_id = auth.uid());

create policy "memories_update_author_or_owner"
  on public.memories for update to authenticated
  using (
    family_id = private.current_family_id()
    and (author_id = auth.uid() or private.current_user_role() = 'owner')
  )
  with check (
    family_id = private.current_family_id()
    and (author_id = auth.uid() or private.current_user_role() = 'owner')
  );

create policy "memories_delete_owner"
  on public.memories for delete to authenticated
  using (family_id = private.current_family_id() and private.current_user_role() = 'owner');

-- memory_attachments — gated through parent memory
create policy "attachments_select_family"
  on public.memory_attachments for select to authenticated
  using (
    exists (select 1 from public.memories m
            where m.id = memory_attachments.memory_id
              and m.family_id = private.current_family_id())
  );

create policy "attachments_insert_family_member"
  on public.memory_attachments for insert to authenticated
  with check (
    exists (select 1 from public.memories m
            where m.id = memory_attachments.memory_id
              and m.family_id = private.current_family_id()
              and (m.author_id = auth.uid() or private.current_user_role() = 'owner'))
  );

create policy "attachments_delete_author_or_owner"
  on public.memory_attachments for delete to authenticated
  using (
    exists (select 1 from public.memories m
            where m.id = memory_attachments.memory_id
              and m.family_id = private.current_family_id()
              and (m.author_id = auth.uid() or private.current_user_role() = 'owner'))
  );

-- prompt_assignments — owner schedules; senior reads
create policy "assignments_select_family"
  on public.prompt_assignments for select to authenticated
  using (family_id = private.current_family_id());

create policy "assignments_write_owner"
  on public.prompt_assignments for insert to authenticated
  with check (family_id = private.current_family_id() and private.current_user_role() = 'owner');

create policy "assignments_update_owner"
  on public.prompt_assignments for update to authenticated
  using (family_id = private.current_family_id() and private.current_user_role() = 'owner')
  with check (family_id = private.current_family_id() and private.current_user_role() = 'owner');

create policy "assignments_delete_owner"
  on public.prompt_assignments for delete to authenticated
  using (family_id = private.current_family_id() and private.current_user_role() = 'owner');

-- book_orders — owner only
create policy "orders_select_owner"
  on public.book_orders for select to authenticated
  using (family_id = private.current_family_id() and private.current_user_role() = 'owner');

create policy "orders_insert_owner"
  on public.book_orders for insert to authenticated
  with check (family_id = private.current_family_id() and private.current_user_role() = 'owner');

create policy "orders_update_owner"
  on public.book_orders for update to authenticated
  using (family_id = private.current_family_id() and private.current_user_role() = 'owner')
  with check (family_id = private.current_family_id() and private.current_user_role() = 'owner');

-- activity_log — read by family members; writes via service role only
create policy "activity_select_family"
  on public.activity_log for select to authenticated
  using (family_id = private.current_family_id());

-- ---------------------------------------------------------------------------
-- Storage buckets + policies
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public) values
  ('memory-audio',       'memory-audio',       false),
  ('memory-attachments', 'memory-attachments', false),
  ('avatars',            'avatars',            true)
on conflict (id) do nothing;

-- memory-audio (private, family-scoped via {family_id}/... path)
create policy "memory_audio_select_family"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'memory-audio'
    and ((storage.foldername(name))[1])::uuid = private.current_family_id()
  );

create policy "memory_audio_insert_family"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'memory-audio'
    and ((storage.foldername(name))[1])::uuid = private.current_family_id()
  );

create policy "memory_audio_update_family"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'memory-audio'
    and ((storage.foldername(name))[1])::uuid = private.current_family_id()
  )
  with check (
    bucket_id = 'memory-audio'
    and ((storage.foldername(name))[1])::uuid = private.current_family_id()
  );

create policy "memory_audio_delete_owner"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'memory-audio'
    and ((storage.foldername(name))[1])::uuid = private.current_family_id()
    and private.current_user_role() = 'owner'
  );

-- memory-attachments (private, family-scoped)
create policy "memory_attachments_select_family"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'memory-attachments'
    and ((storage.foldername(name))[1])::uuid = private.current_family_id()
  );

create policy "memory_attachments_insert_family"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'memory-attachments'
    and ((storage.foldername(name))[1])::uuid = private.current_family_id()
  );

create policy "memory_attachments_update_family"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'memory-attachments'
    and ((storage.foldername(name))[1])::uuid = private.current_family_id()
  )
  with check (
    bucket_id = 'memory-attachments'
    and ((storage.foldername(name))[1])::uuid = private.current_family_id()
  );

create policy "memory_attachments_delete_owner"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'memory-attachments'
    and ((storage.foldername(name))[1])::uuid = private.current_family_id()
    and private.current_user_role() = 'owner'
  );

-- avatars: public bucket — readable via direct URL only (no broad SELECT policy
-- to prevent listing). Users can write only their own avatar named {user_id}.{ext}.
create policy "avatars_insert_self"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.filename(name) like (auth.uid()::text || '.%'))
  );

create policy "avatars_update_self"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.filename(name) like (auth.uid()::text || '.%'))
  )
  with check (
    bucket_id = 'avatars'
    and (storage.filename(name) like (auth.uid()::text || '.%'))
  );

create policy "avatars_delete_self"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.filename(name) like (auth.uid()::text || '.%'))
  );
