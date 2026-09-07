import "server-only";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import type { Report, Deck, TradeListing, Tournament, Card } from "@/lib/types/database";

/**
 * 홈 대시보드용 읽기 쿼리 모음.
 * DB 미연결/오류 시 빈 배열을 반환해 페이지가 깨지지 않도록 한다(직관적 빈 상태 렌더).
 */

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  if (!hasSupabaseEnv) return fallback;
  try {
    return await fn();
  } catch (e) {
    console.error("[queries]", e);
    return fallback;
  }
}

export function getLatestReports(limit = 4) {
  return safe<Report[]>(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  }, []);
}

export type ReportWithAuthor = Report & {
  author: { username: string; avatar_url: string | null } | null;
};

export function getReports() {
  return safe<ReportWithAuthor[]>(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("reports")
      .select("*, author:profiles!reports_author_id_fkey(username, avatar_url)")
      .eq("status", "published")
      .order("published_at", { ascending: false });
    if (error) throw error;
    return (data as unknown as ReportWithAuthor[]) ?? [];
  }, []);
}

export function getReport(slug: string) {
  return safe<ReportWithAuthor | null>(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("reports")
      .select("*, author:profiles!reports_author_id_fkey(username, avatar_url)")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();
    if (error) throw error;
    return (data as unknown as ReportWithAuthor) ?? null;
  }, null);
}

export function getTournaments() {
  return safe<Tournament[]>(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("tournaments")
      .select("*")
      .order("starts_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  }, []);
}

export function getTournament(slug: string) {
  return safe<Tournament | null>(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("tournaments")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    if (error) throw error;
    return data ?? null;
  }, null);
}

export type DeckWithChampions = Deck & { champions: Pick<Card, "id" | "name" | "image_url">[] };

export function getTierSummary() {
  return safe<DeckWithChampions[]>(async () => {
    const supabase = createClient();
    const { data: decks, error } = await supabase
      .from("decks")
      .select("*")
      .order("tier", { ascending: true })
      .order("tier_rank", { ascending: true });
    if (error) throw error;
    if (!decks?.length) return [];

    // champion_card_ids(uuid[]) 는 배열 컬럼이라 조인이 아닌 IN 조회로 해결
    const championIds = [...new Set(decks.flatMap((d) => d.champion_card_ids))];
    const { data: cards } = championIds.length
      ? await supabase.from("cards").select("id,name,image_url").in("id", championIds)
      : { data: [] as Pick<Card, "id" | "name" | "image_url">[] };

    const cardById = new Map((cards ?? []).map((c) => [c.id, c]));
    return decks.map((d) => ({
      ...d,
      champions: d.champion_card_ids
        .map((id) => cardById.get(id))
        .filter((c): c is Pick<Card, "id" | "name" | "image_url"> => Boolean(c)),
    }));
  }, []);
}

export function getRecentTrades(limit = 4) {
  return safe<TradeListing[]>(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("trade_listings")
      .select("*")
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  }, []);
}

export function getUpcomingTournaments(limit = 3) {
  return safe<Tournament[]>(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("tournaments")
      .select("*")
      .in("status", ["upcoming", "ongoing"])
      .order("starts_at", { ascending: true })
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  }, []);
}
