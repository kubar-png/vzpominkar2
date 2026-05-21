-- Owners can mark memories as favorite to bias the book toward best moments.
ALTER TABLE public.memories
  ADD COLUMN IF NOT EXISTS is_favorite boolean NOT NULL DEFAULT false;

-- Index supports the common query: "favorites first, then by date".
CREATE INDEX IF NOT EXISTS memories_family_favorite_idx
  ON public.memories (family_id, is_favorite DESC, created_at DESC);
