import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Helper to bulk-sign storage URLs (15-min expiry per UI guide §10).
 */
export async function batchSignUrls(
  bucket: string,
  paths: string[],
  expiresIn = 60 * 15,
): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (paths.length === 0) return out;
  const supabase = createAdminClient();
  const { data } = await supabase.storage.from(bucket).createSignedUrls(paths, expiresIn);
  for (const row of data ?? []) {
    if (row.path && row.signedUrl) out.set(row.path, row.signedUrl);
  }
  return out;
}
