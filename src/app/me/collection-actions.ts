"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function requireUser() {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login?next=/me");
  return { supabase, userId: data.user.id };
}

/** 카드 보유 수량 설정. 0이면 삭제. 덱 3장 규칙과 무관하게 실제 수량. */
export async function setCollectionQty(
  cardId: string,
  quantity: number,
): Promise<{ error?: string }> {
  const { supabase, userId } = await requireUser();
  const id = String(cardId).slice(0, 200);
  const qty = Math.max(0, Math.min(999, Math.floor(Number(quantity) || 0)));

  if (!id) return { error: "카드를 확인하세요" };

  if (qty === 0) {
    const { error } = await supabase
      .from("collection_items")
      .delete()
      .eq("user_id", userId)
      .eq("card_id", id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from("collection_items")
      .upsert(
        { user_id: userId, card_id: id, quantity: qty, updated_at: new Date().toISOString() },
        { onConflict: "user_id,card_id" },
      );
    if (error) return { error: error.message };
  }

  revalidatePath("/me");
  return {};
}
