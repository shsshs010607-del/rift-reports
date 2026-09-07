"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { SavedDeck } from "@/lib/types/database";

export type SaveDeckState = { error?: string; ok?: boolean; saved?: SavedDeck };

const MAX_DECKS = 30;

async function requireUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/deck-simulator");
  return { supabase, userId: user.id };
}

export async function saveDeck(input: {
  id?: string;
  name: string;
  code: string;
  legendName?: string | null;
}): Promise<SaveDeckState> {
  const { supabase, userId } = await requireUser();

  const name = input.name.trim().slice(0, 60) || "내 덱";
  const code = input.code.trim();
  if (!code.startsWith("rr1.")) return { error: "덱 코드를 만들 수 없습니다 (카드를 더 추가해 주세요)." };

  if (input.id) {
    const { data, error } = await supabase
      .from("saved_decks")
      .update({ name, code, legend_name: input.legendName ?? null, updated_at: new Date().toISOString() })
      .eq("id", input.id)
      .eq("user_id", userId)
      .select("*")
      .single();
    if (error) return { error: error.message };
    revalidatePath("/me");
    return { ok: true, saved: data as SavedDeck };
  }

  const { count } = await supabase
    .from("saved_decks")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);
  if ((count ?? 0) >= MAX_DECKS) {
    return { error: `저장 덱은 최대 ${MAX_DECKS}개입니다. 기존 덱을 지워 주세요.` };
  }

  const { data, error } = await supabase
    .from("saved_decks")
    .insert({ user_id: userId, name, code, legend_name: input.legendName ?? null })
    .select("*")
    .single();
  if (error) return { error: error.message };
  revalidatePath("/me");
  return { ok: true, saved: data as SavedDeck };
}

export async function deleteSavedDeck(id: string): Promise<void> {
  const { supabase, userId } = await requireUser();
  await supabase.from("saved_decks").delete().eq("id", id).eq("user_id", userId);
  revalidatePath("/me");
}

export async function listMyDecks(): Promise<SavedDeck[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("saved_decks")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });
  return (data as SavedDeck[]) ?? [];
}
