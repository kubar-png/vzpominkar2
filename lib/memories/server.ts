import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Resolve a prompt assignment to its question text.
 */
export async function getAssignmentContext(assignmentId: string | null) {
  if (!assignmentId) return null;
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("prompt_assignments")
    .select("id, prompt_id, prompts(question)")
    .eq("id", assignmentId)
    .maybeSingle<{
      id: string;
      prompt_id: string;
      prompts: { question: string } | null;
    }>();
  if (!data?.prompts) return null;
  return { assignmentId: data.id, question: data.prompts.question };
}
