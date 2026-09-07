import "server-only";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import type { TradeListing, TradingCategory, TradeStatus } from "@/lib/types/database";

export type ListingWithSeller = TradeListing & {
  seller: { username: string; avatar_url: string | null } | null;
};

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  if (!hasSupabaseEnv) return fallback;
  try {
    return await fn();
  } catch (e) {
    console.error("[trading]", e);
    return fallback;
  }
}

const SELLER = "seller:profiles!trade_listings_seller_id_fkey(username, avatar_url)";

export function getListings(opts: {
  category?: TradingCategory;
  status?: TradeStatus;
  region?: string;
  q?: string;
} = {}) {
  return safe<ListingWithSeller[]>(async () => {
    const supabase = createClient();
    let query = supabase
      .from("trade_listings")
      .select(`*, ${SELLER}`)
      .order("created_at", { ascending: false })
      .limit(100);

    if (opts.category) query = query.eq("category", opts.category);
    if (opts.status) query = query.eq("status", opts.status);
    if (opts.region) query = query.eq("region", opts.region);
    if (opts.q?.trim()) {
      const term = opts.q.trim().replace(/[%,()]/g, " ");
      query = query.or(`title.ilike.%${term}%,description.ilike.%${term}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data as unknown as ListingWithSeller[]) ?? [];
  }, []);
}

export function getListing(id: string) {
  return safe<ListingWithSeller | null>(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("trade_listings")
      .select(`*, ${SELLER}`)
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return (data as unknown as ListingWithSeller) ?? null;
  }, null);
}
