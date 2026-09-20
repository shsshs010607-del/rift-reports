import type { Card, CardType } from "@/lib/types/card";

/**
 * 덱 모델.
 * - 전설 / 선발 챔피언은 각 1장 슬롯(id).
 * - 나머지(주 덱·룬·전장)는 entries 에 id+장수로. 존은 카드 타입에서 파생.
 * - 사이드덱은 `side` 에 따로 (0장 또는 10장). 이전에 저장된 덱엔 없을 수 있어 optional.
 * 저장은 id 만 — 카드 상세는 카드 서비스에서 다시 해석한다.
 */
export interface DeckEntry {
  id: string;
  qty: number;
}

export interface Deck {
  name: string;
  legendId: string | null;
  championId: string | null;
  entries: DeckEntry[];
  side?: DeckEntry[];
}

export const EMPTY_DECK: Deck = { name: "새 덱", legendId: null, championId: null, entries: [], side: [] };

// ── 존 ──────────────────────────────────────────────────────────

export type DeckZone = "legend" | "champion" | "battlefield" | "rune" | "main";

/** 덱 패널에 표시되는 순서. */
export const ZONE_ORDER: readonly DeckZone[] = ["legend", "champion", "battlefield", "rune", "main"];

export interface ZoneMeta {
  label: string;
  /** 목표 장수(검증 기준). */
  target: number;
  /** 표시용 목표 문자열. */
  targetLabel: string;
  /** 정확히 target 이어야 하는지(false 면 이상). */
  exact: boolean;
}

export const ZONE_META: Record<DeckZone, ZoneMeta> = {
  legend: { label: "레전드", target: 1, targetLabel: "1", exact: true },
  champion: { label: "챔피언", target: 1, targetLabel: "1", exact: true },
  battlefield: { label: "전장", target: 3, targetLabel: "3", exact: true },
  rune: { label: "룬", target: 12, targetLabel: "12", exact: true },
  main: { label: "주 덱", target: 39, targetLabel: "39", exact: true },
};

/** entries 카드 타입 → 존 (레전드/챔피언 슬롯은 별도라 여기선 안 나온다). */
export function entryZoneOf(type: CardType): Exclude<DeckZone, "legend" | "champion"> {
  if (type === "rune") return "rune";
  if (type === "battlefield") return "battlefield";
  return "main"; // unit · spell · gear · champion(추가 사본)
}

/** 사이드덱에 넣을 수 있는 카드 타입 (주 덱과 같은 종류). */
export const SIDE_TYPES: readonly CardType[] = ["champion", "unit", "spell", "gear"];

// ── 해석 결과 ───────────────────────────────────────────────────

export interface ResolvedEntry {
  card: Card;
  qty: number;
}

export interface ResolvedDeck {
  name: string;
  legend: Card | null;
  champion: Card | null;
  /** 존별 entries (legend/champion 존은 여기 안 들어감 — 위 legend/champion 필드 사용). */
  sections: Record<Exclude<DeckZone, "legend" | "champion">, ResolvedEntry[]>;
  /** 사이드덱 (0장 또는 10장). */
  side: ResolvedEntry[];
}
