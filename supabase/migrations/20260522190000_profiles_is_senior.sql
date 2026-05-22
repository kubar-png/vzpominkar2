-- Per-profile UI mode flag.
-- `is_senior = true` (default) renders the simplified senior surface:
-- huge buttons, AAA contrast, big fonts, no extra features, formal vykání.
-- `is_senior = false` (klasický) renders compact UI, transcript editing,
-- prompt browsing, lighter copy.
-- Only meaningful on profiles with role = 'senior'. Owners ignore it.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_senior BOOLEAN NOT NULL DEFAULT TRUE;

COMMENT ON COLUMN profiles.is_senior IS 'UI mode for senior-role profiles. True = simplified senior surface (default). False = klasický mode with editing + browsing features.';
