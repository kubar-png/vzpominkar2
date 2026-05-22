-- Editable + AI-polished transcript variants.
-- `audio_transcript` stays as the raw Whisper output (immutable after first save).
-- `audio_transcript_polished` holds the user-edited or AI-cleaned version that
-- the owner / vyprávějící iterates on. When NULL, UI falls back to the raw value.
-- `transcript_edited_at` is set whenever polished gets written, for audit.

ALTER TABLE memories
  ADD COLUMN IF NOT EXISTS audio_transcript_polished TEXT,
  ADD COLUMN IF NOT EXISTS transcript_edited_at TIMESTAMPTZ;

COMMENT ON COLUMN memories.audio_transcript IS 'Raw Whisper output (immutable after first transcription).';
COMMENT ON COLUMN memories.audio_transcript_polished IS 'User-edited or AI-cleaned transcript; NULL means use raw.';
COMMENT ON COLUMN memories.transcript_edited_at IS 'Set whenever polished is written.';
