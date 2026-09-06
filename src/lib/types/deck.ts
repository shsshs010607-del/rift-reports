import type { Card, CardType } from "@/lib/types/card";

/**
 * 덱 모델.
 * - 레전드 / 지정 챔피언은 각 1장 슬롯(id).
 * - 나머지(메인덱·룬·전장)는 entries 에 id+장수로. 존은 카드 타입에서 파생.
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
}

export const EMPTY_DECK: Deck = { name: "새 덱", legendId: null, championId: null, entries: [] };

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
  main: { label: "메인덱", target: 39, targetLabel: "39~59", exact: false },
};

/** entries 카드 타입 → 존 (레전드/챔피언 슬롯은 별도라 여기선 안 나온다). */
export function entryZoneOf(type: CardType): Exclude<DeckZone, "legend" | "champion"> {
  if (type === "rune") return "rune";
  if (type === "battlefield") return "battlefield";
  return "main"; // unit · spell · gear · champion(추가 사본)
}

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
}
