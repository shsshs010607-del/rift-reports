import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { rethrowIfNextControlFlow } from "@/lib/next-dynamic-error";
import type { Report, Deck, Tournament, Card } from "@/lib/types/database";

/**
 * 홈 대시보드용 읽기 쿼리 모음.
 * DB 미연결/오류 시 빈 배열을 반환해 페이지가 깨지지 않도록 한다(직관적 빈 상태 렌더).
 */

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  if (!hasSupabaseEnv) return fallback;
  try {
    return await fn();
  } catch (e) {
    rethrowIfNextControlFlow(e);
    console.error("[queries]", e);
    return fallback;
  }
}

export function getLatestReports(limit = 4) {
  return safe<Report[]>(async () => {
    const supabase = createPublicClient();
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
    const supabase = createPublicClient();
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
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    let staff = false;
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      staff = profile?.role === "editor" || profile?.role === "admin";
    }

    // 스태프는 비공개(draft) 리포트도 미리보기 할 수 있다 — 그 외엔 공개된 것만.
    let query = supabase
      .from("reports")
      .select("*, author:profiles!reports_author_id_fkey(username, avatar_url)")
      .eq("slug", slug);
    if (!staff) query = query.eq("status", "published");

    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    return (data as unknown as ReportWithAuthor) ?? null;
  }, null);
}

const KST_OFFSET_MS = 9 * 3600 * 1000;
const DEFAULT_DURATION_MS = 6 * 3600 * 1000;

/**
 * DB 의 status 컬럼은 등록 시점 값(upcoming)으로 굳어 있어서 아무도 갱신하지 않는다 —
 * 지난 대회도 "다가오는 대회"로 남던 원인. 표시용 상태는 날짜로 계산한다.
 * (운영진이 수동으로 finished 로 바꾼 건 그대로 존중.)
 * 종료 시각이 없으면 시작+6시간, 시작이 KST 00:00(시간 미정)이면 그날 하루 종일로 본다.
 */
function withLiveStatus(t: Tournament, now = Date.now()): Tournament {
  if (t.status === "finished") return t;
  const start = new Date(t.starts_at).getTime();
  const kstMidnight = (start + KST_OFFSET_MS) % (24 * 3600 * 1000) === 0;
  const end = t.ends_at
    ? new Date(t.ends_at).getTime()
    : start + (kstMidnight ? 24 * 3600 * 1000 : DEFAULT_DURATION_MS);
  const status = now >= end ? "finished" : now >= start ? "ongoing" : "upcoming";
  return status === t.status ? t : { ...t, status };
}

export function getTournaments() {
  return safe<Tournament[]>(async () => {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("tournaments")
      .select("*")
      .order("starts_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((t) => withLiveStatus(t));
  }, []);
}

export function getTournament(slug: string) {
  return safe<Tournament | null>(async () => {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("tournaments")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    if (error) throw error;
    return data ? withLiveStatus(data) : null;
  }, null);
}

export type DeckWithChampions = Deck & { champions: Pick<Card, "id" | "name" | "image_url">[] };

export function getTierSummary() {
  return safe<DeckWithChampions[]>(async () => {
    const supabase = createPublicClient();
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

export function getUpcomingTournaments(limit = 3) {
  return safe<Tournament[]>(async () => {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("tournaments")
      .select("*")
      .in("status", ["upcoming", "ongoing"])
      // 저장된 status 는 낡았을 수 있어 하루 전부터 넉넉히 가져온 뒤 날짜 기준으로 다시 거른다
      .gte("starts_at", new Date(Date.now() - 24 * 3600 * 1000).toISOString())
      .order("starts_at", { ascending: true })
      .limit(limit + 40);
    if (error) throw error;
    return (data ?? [])
      .map((t) => withLiveStatus(t))
      .filter((t) => t.status !== "finished")
      .slice(0, limit);
  }, []);
}
