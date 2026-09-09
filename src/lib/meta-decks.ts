import "server-only";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { normLegend } from "@/lib/legend-name";
import type { Database } from "@/lib/types/database";

export type MetaDeck = Database["public"]["Tables"]["meta_decks"]["Row"];
export { normLegend };

/** 메타 덱 전체 (대회 덱 우선, 추천순). */
export async function getMetaDecks(): Promise<MetaDeck[]> {
  if (!hasSupabaseEnv) return [];
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("meta_decks")
      .select("*")
      .order("is_tournament", { ascending: false })
      .order("likes", { ascending: false })
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(300);
    if (error) throw error;
    return data ?? [];
  } catch (e) {
    console.error("[meta-decks]", e);
    return [];
  }
}

/**
 * 레전드 영문명 목록 → 각 레전드의 "가장 인기있는" 메타 덱(대회 덱 우선).
 * 정규화 이름으로 매칭. 없으면 키 누락.
 */
export async function getBestMetaDeckByLegend(
  legendNames: string[],
): Promise<Record<string, MetaDeck>> {
  const decks = await getMetaDecks(); // 이미 대회>추천순 정렬
  const best = new Map<string, MetaDeck>();
  for (const d of decks) {
    const k = normLegend(d.legend_name ?? "");
    if (k && !best.has(k)) best.set(k, d); // 첫 항목 = 최상위
  }
  const out: Record<string, MetaDeck> = {};
  for (const name of legendNames) {
    const k = normLegend(name);
    let hit = best.get(k);
    if (!hit) {
      const first2 = k.split(" ").slice(0, 2).join(" ");
      for (const [mk, v] of best) if (mk.startsWith(first2)) hit = v;
    }
    if (hit) out[name] = hit;
  }
  return out;
}
