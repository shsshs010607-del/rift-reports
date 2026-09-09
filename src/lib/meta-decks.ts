import "server-only";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import type { Database } from "@/lib/types/database";

export type MetaDeck = Database["public"]["Tables"]["meta_decks"]["Row"];

/** 메타 덱 목록 — 대회 덱 우선, 추천순. legend 로 좁힐 수 있다. */
export async function getMetaDecks(opts: { legend?: string } = {}): Promise<MetaDeck[]> {
  if (!hasSupabaseEnv) return [];
  try {
    const supabase = createClient();
    let q = supabase
      .from("meta_decks")
      .select("*")
      .order("is_tournament", { ascending: false })
      .order("likes", { ascending: false })
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(200);
    if (opts.legend) q = q.eq("legend_name", opts.legend);
    const { data, error } = await q;
    if (error) throw error;
    return data ?? [];
  } catch (e) {
    console.error("[meta-decks]", e);
    return [];
  }
}
