-- AI-extracted "when did this happen" — pulled from the transcript/text by
-- a gpt-4o-mini pass right after Whisper finishes (audio) or finalize is
-- pressed (text). The recorder is gently asked to mention a year or period
-- in their narration; AI lifts it out so the owner doesn't have to fill
-- another form. All three columns are nullable — a memory without a clear
-- temporal anchor just doesn't carry one.
--
--   extracted_year         numeric year (1958) for sorting + range maths
--   extracted_year_label   human phrase to show in UI ("léto 1958",
--                          "padesátá léta", "po válce") — preserves the
--                          recorder's framing instead of forcing a number
--   extracted_year_confidence  'high' | 'medium' | 'low' — UI can decide
--                              whether to display with a tentative tone
ALTER TABLE public.memories
  ADD COLUMN IF NOT EXISTS extracted_year smallint,
  ADD COLUMN IF NOT EXISTS extracted_year_label text,
  ADD COLUMN IF NOT EXISTS extracted_year_confidence text
    CHECK (extracted_year_confidence IS NULL
           OR extracted_year_confidence IN ('high', 'medium', 'low'));

-- Range queries ("Pokrýváte X let života" in the stats sidebar) sweep
-- min/max of extracted_year per family, so an index on (family_id,
-- extracted_year) keeps that cheap as the table grows.
CREATE INDEX IF NOT EXISTS memories_family_extracted_year_idx
  ON public.memories (family_id, extracted_year)
  WHERE extracted_year IS NOT NULL;
