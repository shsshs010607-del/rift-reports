import type { Card, CardType } from "@/lib/types/card";

/**
 * 덱 모델.
 * 저장은 카드 id + 장수만 한다(카드 상세는 카드 서비스에서 다시 해석).
 * 존(레전드/메인덱/룬/전장)은 카드 타입에서 파생하므로 별도로 들고 있지 않는다.
 */
export interface DeckEntry {
  id: string;
  qty: number;
}

export interface Deck {
  name: string;
  entries: DeckEntry[];
}

export const EMPTY_DECK: Deck = { name: "새 덱", entries: [] };

/** 덱 존 — 카드 타입을 4개 그룹으로 묶는다. */
export type DeckZone = "legend" | "main" | "rune" | "battlefield";

export const ZONE_LABELS: Record<DeckZone, string> = {
  legend: "레전드",
  rune: "룬덱",
  battlefield: "전장",
  main: "메인덱 (유닛·도구·주문)",
};

/** 카드 타입 → 존. */
export function zoneOf(type: CardType): DeckZone {
  if (type === "legend") return "legend";
  if (type === "rune") return "rune";
  if (type === "battlefield") return "battlefield";
  return "main"; // champion · unit · spell · gear
}

/** 카드 상세까지 붙인 덱 항목 (UI/시뮬레이터에서 사용). */
export interface ResolvedEntry {
  card: Card;
  qty: number;
  zone: DeckZone;
}
