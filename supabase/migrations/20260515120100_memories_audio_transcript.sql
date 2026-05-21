-- Audio memories get a transcript via Whisper. Stored on the memory so the
-- book and search can use the text body. Empty string ≠ null: null means
-- "not yet attempted", "" means "transcription returned nothing".
ALTER TABLE public.memories
  ADD COLUMN IF NOT EXISTS audio_transcript text;
