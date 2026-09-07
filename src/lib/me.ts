import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Post, TradeListing } from "@/lib/types/database";

/** 내가 쓴 글 */
export async function getMyPosts(userId: string, limit = 20): Promise<Post[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .eq("author_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  } catch (e) {
    console.error("[me] posts", e);
    return [];
  }
}

/** 내 거래글 */
export async function getMyListings(userId: string, limit = 20): Promise<TradeListing[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("trade_listings")
      .select("*")
      .eq("seller_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  } catch (e) {
    console.error("[me] listings", e);
    return [];
  }
}
