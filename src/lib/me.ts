import "server-only";
import { createClient } from "@/lib/supabase/server";
import { rethrowIfNextControlFlow } from "@/lib/next-dynamic-error";
import type { Post } from "@/lib/types/database";

/** 내가 쓴 글 */
export async function getMyPosts(userId: string, limit = 20): Promise<Post[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .eq("author_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  } catch (e) {
    rethrowIfNextControlFlow(e);
    console.error("[me] posts", e);
    return [];
  }
}
