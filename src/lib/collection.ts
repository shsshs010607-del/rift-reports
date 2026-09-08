import "server-only";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export type CollectionItem = { card_id: string; quantity: number };

/**
 * 로그인 유저의 컬렉션(보유 카드).
 * collection_items 테이블이 아직 없으면(마이그레이션 전) 조용히 빈 배열.
 */
export async function getMyCollection(): Promise<CollectionItem[]> {
  if (!hasSupabaseEnv) return [];
  try {
    const supabase = createClient();
    const { data: userRes } = await supabase.auth.getUser();
    if (!userRes.user) return [];
    const { data, error } = await supabase
      .from("collection_items")
      .select("card_id, quantity")
      .eq("user_id", userRes.user.id)
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return (data as CollectionItem[]) ?? [];
  } catch (e) {
    console.warn("[collection] 조회 실패(테이블 미생성?):", e);
    return [];
  }
}
