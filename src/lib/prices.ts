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

const SPECIAL_RE = /showcase|signature|promo|overnumbered/i;
/** 쇼케이스·시그니처 등 특별판이면 true (일반 시세 목록에서 제외). */
function isSpecialPrint(p: PrintWithKo | null): boolean {
  if (!p) return false;
  return (
    SPECIAL_RE.test(p.rarity ?? "") ||
    SPECIAL_RE.test(p.art_variant ?? "") ||
    /[*]/.test(p.number ?? "")
  );
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
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("price_snapshots")
      .select("*, print:card_prints(*)")
      .eq("is_current", true)
      .eq("is_headline", true)
      .not("change_7d", "is", null)
      .not("market_price", "is", null)
      // 동점(같은 값) 행이 매 요청마다 순서가 뒤바뀌지 않도록 결정적 정렬 키를 준다.
      .order("change_7d", { ascending: dir === "asc" })
      .order("print_id", { ascending: true })
      .limit(600);
    if (error) throw error;
    // 퍼센트가 아니라 "절대 변동액(USD)" 기준으로 정렬한다.
    const rows = ((data as unknown as PriceRow[]) ?? [])
      .filter((r) => r.market_price != null && r.change_7d != null && r.change_7d !== 0)
      .map((r) => (r.print ? { ...r, print: localizePrint(r.print) } : r))
      .filter((r) => !isSpecialPrint(r.print)); // 급등·급락은 일반 카드만
    rows.sort((a, b) => {
      const da = deltaUsd(a.market_price!, a.change_7d!);
      const db = deltaUsd(b.market_price!, b.change_7d!);
      const primary = dir === "asc" ? da - db : db - da;
      if (primary !== 0 && Number.isFinite(primary)) return primary;
      return a.print_id.localeCompare(b.print_id); // 동점 → 결정적
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
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("price_snapshots")
      .select("*, print:card_prints(*)")
      .eq("is_current", true)
      .eq("is_headline", true)
      .not("market_price", "is", null)
      .order("market_price", { ascending: false })
      .order("print_id", { ascending: true }) // 동점 시세 행의 순서를 고정 (매 요청 셔플 방지)
      .limit(limit);
    if (error) throw error;
    return ((data as unknown as PriceRow[]) ?? []).map((r) =>
      r.print ? { ...r, print: localizePrint(r.print) } : r,
    );
  }, []);
}

/**
 * 카드 DB 쪽 카드 번호("OGN-039" 형식, {@link cardNumber})로 찾는 시세 인덱스.
 * card_prints.number 는 "039a/298" 처럼 총 장수·이색아트 접미사가 붙어 있어, 숫자만 남겨
 * cardNumber() 와 같은 형식으로 정규화한다. 같은 번호에 이색아트/오버넘버 변형이 여럿이면
 * 접미사 없는(기본) 인쇄판을 우선한다 — "내가 보유한 평범한 카드" 기준 시세.
 */
export function getPriceIndex() {
  return safe<Map<string, { usd: number; printId: string }>>(async () => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("price_snapshots")
      .select("market_price, print:card_prints(id, set_code, number)")
      .eq("is_current", true)
      .eq("is_headline", true)
      .not("market_price", "is", null);
    if (error) throw error;

    const isBaseByKey = new Map<string, boolean>();
    const map = new Map<string, { usd: number; printId: string }>();
    for (const row of (data as unknown as { market_price: number; print: CardPrint | null }[]) ?? []) {
      const print = row.print;
      if (!print?.set_code || !print.number) continue;
      const raw = print.number.split("/")[0]?.trim() ?? "";
      const digits = raw.replace(/\D+/g, "");
      if (!digits) continue;
      const key = `${print.set_code}-${digits.padStart(3, "0")}`;
      const isBase = !/[^0-9]/.test(raw);
      if (isBaseByKey.get(key)) continue; // 이미 기본 인쇄판을 찾았으면 유지
      isBaseByKey.set(key, isBase);
      map.set(key, { usd: row.market_price, printId: print.id });
    }
    return map;
  }, new Map());
}

/** 프린트 + 현재 대표 시세 */
export function getPrintWithPrice(printId: string) {
  return safe<{ print: PrintWithKo; price: PriceSnapshot | null } | null>(async () => {
    const supabase = await createClient();
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
    const supabase = await createClient();
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
    const supabase = await createClient();
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
