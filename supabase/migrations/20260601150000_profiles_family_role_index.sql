-- The hottest query shape app-wide is WHERE family_id = ? AND role = ?
-- (dashboard, cron, memory notifications, rodina, senior pages). A composite
-- index keeps it index-only as the profiles table grows past 2 rows/family.
create index if not exists profiles_family_role_idx
  on public.profiles (family_id, role);
