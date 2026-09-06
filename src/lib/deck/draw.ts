import type { Card } from "@/lib/types/card";
import type { ResolvedEntry } from "@/lib/types/deck";
import { DECK_RULES } from "@/lib/constants";

/**
 * 오프닝 핸드 드로우 & 멀리건 시뮬레이션.
 *
 * 리프트바운드: 메인덱을 섞어 4장을 뽑는다. 멀리건은 1회 —
 * 최대 2장을 덱 맨 아래로 내리고 같은 수만큼 다시 뽑는다.
 */

export interface DrawState {
  /** 현재 손패 (뽑힌 순서). */
  hand: Card[];
  /** 남은 덱 (맨 앞이 다음에 뽑을 카드). */
  library: Card[];
  /** 멀리건을 이미 썼는지. */
  mulliganed: boolean;
}

/** Fisher–Yates. rng 기본값은 Math.random. */
export function shuffle<T>(arr: T[], rng: () => number = Math.random): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 메인덱 존 카드들을 장수만큼 펼친 실물 카드 배열. */
export function buildLibrary(entries: ResolvedEntry[]): Card[] {
  const out: Card[] = [];
  for (const e of entries) {
    if (e.zone !== "main") continue;
    for (let i = 0; i < e.qty; i++) out.push(e.card);
  }
  return out;
}

/** 새 게임: 섞고 4장 드로우. */
export function openingDraw(entries: ResolvedEntry[], rng: () => number = Math.random): DrawState {
  const shuffled = shuffle(buildLibrary(entries), rng);
  const size = Math.min(DECK_RULES.openingHand, shuffled.length);
  return {
    hand: shuffled.slice(0, size),
    library: shuffled.slice(size),
    mulliganed: false,
  };
}

/**
 * 멀리건: `bottomIndices` 로 지정한 손패 카드(최대 2장)를 덱 맨 아래로 내리고
 * 같은 수만큼 덱 위에서 다시 뽑는다. 1회만 가능.
 */
export function mulligan(
  state: DrawState,
  bottomIndices: number[],
  rng: () => number = Math.random,
): DrawState {
  if (state.mulliganed) return state;

  const unique = [...new Set(bottomIndices)].filter((i) => i >= 0 && i < state.hand.length);
  const toBottom = unique.slice(0, DECK_RULES.mulliganMax);

  const kept = state.hand.filter((_, i) => !toBottom.includes(i));
  const returned = state.hand.filter((_, i) => toBottom.includes(i));

  // 되돌린 카드는 섞어서 덱 맨 아래로
  const library = [...state.library, ...shuffle(returned, rng)];
  const drawn = library.slice(0, returned.length);

  return {
    hand: [...kept, ...drawn],
    library: library.slice(returned.length),
    mulliganed: true,
  };
}
