import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Resolve a prompt assignment to its question text.
 *
 * Scoped to the caller's `familyId` so a senior can't read another family's
 * prompt by passing an arbitrary `?assignment=` UUID (the admin client here
 * bypasses RLS, so this app-level scope is the only guard).
 */
export async function getAssignmentContext(
  assignmentId: string | null,
  familyId: string | null,
) {
  if (!assignmentId || !familyId) return null;
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("prompt_assignments")
    .select("id, prompt_id, prompts(question)")
    .eq("id", assignmentId)
    .eq("family_id", familyId)
    .maybeSingle<{
      id: string;
      prompt_id: string;
      prompts: { question: string } | null;
    }>();
  if (!data?.prompts) return null;
  return { assignmentId: data.id, question: data.prompts.question };
}
