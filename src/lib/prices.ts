import "server-only";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { PRICE } from "@/lib/constants";
import { deltaUsd } from "@/lib/money";
import { koCardName } from "@/lib/card-names";
import type { CardPrint, PriceSnapshot } from "@/lib/types/database";

export type PrintWithKo = CardPrint & { ko_name?: string };
export type PriceRow = PriceSnapshot & { print: PrintWithKo | null };

/** print.name(영문) 에 대응하는 한글명을 ko_name 으로 채운다. */
function localizePrint<T extends { name: string; name_en?: string | null }>(p: T): T & { ko_name: string } {
  return { ...p, ko_name: koCardName(p.name_en ?? p.name) };
}

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  if (!hasSupabaseEnv) return fallback;
  try {
    return await fn();
  } catch (e) {
    console.error("[prices]", e);
    return fallback;
  }
}

function moverQuery(dir: "asc" | "desc", limit: number) {
  return safe<PriceRow[]>(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("price_snapshots")
      .select("*, print:card_prints(*)")
      .eq("is_current", true)
      .eq("is_headline", true)
      .not("change_7d", "is", null)
      .not("market_price", "is", null)
      .limit(600);
    if (error) throw error;
    // 퍼센트가 아니라 "절대 변동액(USD)" 기준으로 정렬한다.
    const rows = ((data as unknown as PriceRow[]) ?? [])
      .filter((r) => r.market_price != null && r.change_7d != null && r.change_7d !== 0)
      .map((r) => (r.print ? { ...r, print: localizePrint(r.print) } : r));
    rows.sort((a, b) => {
      const da = deltaUsd(a.market_price!, a.change_7d!);
      const db = deltaUsd(b.market_price!, b.change_7d!);
      return dir === "asc" ? da - db : db - da;
    });
    return rows.slice(0, limit);
  }, []);
}

/** 급등 Top N (7일 변동액 큰 순) */
export const getTopGainers = (limit = 5) => moverQuery("desc", limit);
/** 급락 Top N (7일 변동액 작은 순) */
export const getTopLosers = (limit = 5) => moverQuery("asc", limit);

/**
 * 시세표 — 현재 대표(headline) 스냅샷 + 프린트 전체 목록.
 * 정렬·검색·세트 필터는 클라이언트(<PriceBoard/>)에서 처리한다.
 */
export function getPriceBoard(limit = 600) {
  return safe<PriceRow[]>(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("price_snapshots")
      .select("*, print:card_prints(*)")
      .eq("is_current", true)
      .eq("is_headline", true)
      .not("market_price", "is", null)
      .order("market_price", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return ((data as unknown as PriceRow[]) ?? []).map((r) =>
      r.print ? { ...r, print: localizePrint(r.print) } : r,
    );
  }, []);
}

/** 프린트 + 현재 대표 시세 */
export function getPrintWithPrice(printId: string) {
  return safe<{ print: PrintWithKo; price: PriceSnapshot | null } | null>(async () => {
    const supabase = createClient();
    const { data: print, error } = await supabase
      .from("card_prints")
      .select("*")
      .eq("id", printId)
      .maybeSingle();
    if (error) throw error;
    if (!print) return null;

    const { data: price } = await supabase
      .from("price_snapshots")
      .select("*")
      .eq("print_id", printId)
      .eq("is_current", true)
      .eq("is_headline", true)
      .maybeSingle();

    return { print: localizePrint(print as CardPrint), price: (price as PriceSnapshot) ?? null };
  }, null);
}

/** 프린트의 모든 현재 변형 시세 (condition·printing 별) */
export function getPrintVariants(printId: string) {
  return safe<PriceSnapshot[]>(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("price_snapshots")
      .select("*")
      .eq("print_id", printId)
      .eq("is_current", true)
      .order("market_price", { ascending: true });
    if (error) throw error;
    return (data as PriceSnapshot[]) ?? [];
  }, []);
}

/** 같은 카드의 다른 언어·일러스트·레어도 프린트 + 각 대표가 */
export function getPrintGroup(groupId: string) {
  return safe<{ print: PrintWithKo; price: PriceSnapshot | null }[]>(async () => {
    const supabase = createClient();
    const { data: prints, error } = await supabase
      .from("card_prints")
      .select("*")
      .eq("group_id", groupId)
      .order("language", { ascending: true });
    if (error) throw error;
    if (!prints?.length) return [];

    const { data: prices } = await supabase
      .from("price_snapshots")
      .select("*")
      .eq("is_current", true)
      .eq("is_headline", true)
      .in(
        "print_id",
        prints.map((p) => p.id),
      );
    const byPrint = new Map((prices ?? []).map((p) => [p.print_id, p as PriceSnapshot]));
    return prints.map((p) => ({ print: localizePrint(p as CardPrint), price: byPrint.get(p.id) ?? null }));
  }, []);
}

export function isStale(capturedAt: string | null | undefined) {
  if (!capturedAt) return true;
  return Date.now() - new Date(capturedAt).getTime() > PRICE.staleHours * 3600_000;
}
