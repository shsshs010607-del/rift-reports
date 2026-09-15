import "server-only";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { rethrowIfNextControlFlow } from "@/lib/next-dynamic-error";
import type { Shop } from "@/lib/types/database";

export async function getShops(): Promise<Shop[]> {
  if (!hasSupabaseEnv) return [];
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("shops")
      .select("*")
      .order("is_official", { ascending: false })
      .order("sido", { ascending: true })
      .order("name", { ascending: true });
    if (error) throw error;
    return data ?? [];
  } catch (e) {
    rethrowIfNextControlFlow(e);
    console.error("[shops]", e);
    return [];
  }
}
