-- Add per-senior tracking so each senior gets their own assignment queue.
ALTER TABLE public.prompt_assignments
  ADD COLUMN IF NOT EXISTS senior_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Seniors now only see their own assignments; owners see all family assignments.
DROP POLICY IF EXISTS "assignments_select_family" ON public.prompt_assignments;

CREATE POLICY "assignments_select_owner_or_senior"
  ON public.prompt_assignments FOR SELECT TO authenticated
  USING (
    family_id = private.current_family_id()
    AND (
      private.current_user_role() = 'owner'
      OR senior_id = auth.uid()
    )
  );
