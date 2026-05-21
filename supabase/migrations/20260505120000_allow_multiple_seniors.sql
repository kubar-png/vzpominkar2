-- Allow multiple seniors per family.
-- The one-owner-per-family constraint (profiles_one_owner_per_family) stays.
DROP INDEX IF EXISTS profiles_one_senior_per_family;
