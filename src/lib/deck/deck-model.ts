import type { Card } from "@/lib/types/card";
import { DECK_RULES } from "@/lib/constants";
import {
  type Deck,
  type DeckZone,
  type ResolvedDeck,
  type ResolvedEntry,
  ZONE_META,
  entryZoneOf,
} from "@/lib/types/deck";

/**
 * 덱 상태 순수 함수 모음 (React 밖에서도 테스트 가능). 상태는 항상 새 객체로 반환.
 */

// ── 뮤테이션 ────────────────────────────────────────────────────

export function setLegend(deck: Deck, id: string | null): Deck {
  return { ...deck, legendId: id };
}

export function setChampion(deck: Deck, id: string | null): Deck {
  return { ...deck, championId: id };
}

export function addEntry(deck: Deck, id: string, delta = 1): Deck {
  const entries = [...deck.entries];
  const i = entries.findIndex((e) => e.id === id);
  if (i === -1) {
    if (delta <= 0) return deck;
    entries.push({ id, qty: delta });
  } else {
    const qty = entries[i].qty + delta;
    if (qty <= 0) entries.splice(i, 1);
    else entries[i] = { ...entries[i], qty };
  }
  return { ...deck, entries };
}

export function removeEntry(deck: Deck, id: string): Deck {
  return { ...deck, entries: deck.entries.filter((e) => e.id !== id) };
}

export function renameDeck(deck: Deck, name: string): Deck {
  return { ...deck, name: name.slice(0, 60) };
}

export function clearDeck(deck: Deck): Deck {
  return { ...deck, legendId: null, championId: null, entries: [] };
}

// ── 해석 ───────────────────────────────────────────────────────

export function resolveDeck(deck: Deck, pool: Map<string, Card>): ResolvedDeck {
  const sections: ResolvedDeck["sections"] = { battlefield: [], rune: [], main: [] };
  for (const e of deck.entries) {
    const card = pool.get(e.id);
    if (!card) continue;
    sections[entryZoneOf(card.type)].push({ card, qty: e.qty });
  }
  const byCurve = (a: ResolvedEntry, b: ResolvedEntry) =>
    (a.card.cost ?? 99) - (b.card.cost ?? 99) ||
    (b.card.power ?? -1) - (a.card.power ?? -1) ||
    a.card.name.localeCompare(b.card.name, "en");
  sections.battlefield.sort(byCurve);
  sections.rune.sort(byCurve);
  sections.main.sort(byCurve);

  return {
    name: deck.name,
    legend: (deck.legendId && pool.get(deck.legendId)) || null,
    champion: (deck.championId && pool.get(deck.championId)) || null,
    sections,
  };
}

/** 존별 현재 장수. */
export function zoneCounts(rd: ResolvedDeck): Record<DeckZone, number> {
  return {
    legend: rd.legend ? 1 : 0,
    champion: rd.champion ? 1 : 0,
    battlefield: rd.sections.battlefield.reduce((s, e) => s + e.qty, 0),
    rune: rd.sections.rune.reduce((s, e) => s + e.qty, 0),
    main: rd.sections.main.reduce((s, e) => s + e.qty, 0),
  };
}

export function totalCards(rd: ResolvedDeck): number {
  const c = zoneCounts(rd);
  return c.legend + c.champion + c.battlefield + c.rune + c.main;
}

// ── 색 정체성 ───────────────────────────────────────────────────

/** 레전드(없으면 챔피언)의 도메인 = 덱 색 정체성. */
export function identityDomains(rd: ResolvedDeck): string[] {
  return rd.legend?.domains ?? rd.champion?.domains ?? [];
}

/** 카드가 덱 색 정체성에 맞는지. 정체성 미정이거나 무색 카드는 항상 OK. */
export function matchesIdentity(rd: ResolvedDeck, card: Card): boolean {
  const id = identityDomains(rd);
  if (id.length === 0) return true;
  if (card.domains.length === 0) return true;
  return card.domains.some((d) => id.includes(d));
}

/** "Jinx - Loose Cannon" → "jinx" (챔피언 이름 = " - " 앞부분). */
export function championName(name: string): string {
  return name.split(/\s+[-–]\s+/)[0].trim().toLowerCase();
}

/**
 * 지정 챔피언은 레전드와 같은 챔피언 이름이어야 한다.
 * (레전드 "Jinx - Loose Cannon" → 챔피언은 "Jinx - …" 만)
 */
export function matchesLegendChampion(rd: ResolvedDeck, card: Card): boolean {
  if (card.type !== "champion") return true;
  if (!rd.legend) return true; // 레전드 미정이면 제한 없음
  return championName(card.localization.en.name) === championName(rd.legend.localization.en.name);
}

// ── 검증 ───────────────────────────────────────────────────────

export interface DeckIssue {
  level: "error" | "warn";
  message: string;
}

export function validateDeck(rd: ResolvedDeck): DeckIssue[] {
  const issues: DeckIssue[] = [];
  const c = zoneCounts(rd);

  if (!rd.legend) issues.push({ level: "warn", message: "레전드를 선택하세요." });
  if (!rd.champion) issues.push({ level: "warn", message: "지정 챔피언을 선택하세요." });
  if (c.main < DECK_RULES.mainMin)
    issues.push({ level: "error", message: `메인덱이 ${DECK_RULES.mainMin}장 미만입니다 (현재 ${c.main}장).` });
  if (c.main > DECK_RULES.mainMax)
    issues.push({ level: "error", message: `메인덱이 ${DECK_RULES.mainMax}장을 넘습니다 (현재 ${c.main}장).` });
  if (c.rune !== DECK_RULES.runeCount)
    issues.push({
      level: c.rune === 0 ? "warn" : "error",
      message: `룬은 정확히 ${DECK_RULES.runeCount}장이어야 합니다 (현재 ${c.rune}장).`,
    });
  if (c.battlefield !== DECK_RULES.battlefieldCount)
    issues.push({
      level: c.battlefield === 0 ? "warn" : "error",
      message: `전장은 ${DECK_RULES.battlefieldCount}장이어야 합니다 (현재 ${c.battlefield}장).`,
    });

  // 이름당 최대 3장 — 부제가 다르면 다른 카드. 리더 챔피언 슬롯도 카운트.
  const mainByName = new Map<string, number>();
  for (const e of rd.sections.main)
    mainByName.set(e.card.name, (mainByName.get(e.card.name) ?? 0) + e.qty);
  if (rd.champion) mainByName.set(rd.champion.name, (mainByName.get(rd.champion.name) ?? 0) + 1);
  for (const [name, total] of mainByName) {
    if (total > DECK_RULES.maxCopies)
      issues.push({
        level: "error",
        message: `"${name}" ${total}장 (리더 포함) — 이름당 최대 ${DECK_RULES.maxCopies}장.`,
      });
  }

  if (rd.legend || rd.champion) {
    const all: Card[] = [
      ...(rd.champion ? [rd.champion] : []),
      ...rd.sections.battlefield.map((e) => e.card),
      ...rd.sections.rune.map((e) => e.card),
      ...rd.sections.main.map((e) => e.card),
    ];
    for (const card of all)
      if (!matchesIdentity(rd, card))
        issues.push({ level: "error", message: `"${card.name}" 은(는) 덱 색이 아닙니다.` });
  }

  if (rd.champion && rd.legend && !matchesLegendChampion(rd, rd.champion))
    issues.push({
      level: "error",
      message: `지정 챔피언은 레전드(${rd.legend.name})와 같은 챔피언이어야 합니다.`,
    });
  // 메인덱의 다른 챔피언 유닛은 색만 맞으면 허용 (위 색 검증에서 이미 처리됨).

  return issues;
}

/**
 * 풀에서 카드를 눌렀을 때의 동작 결정.
 *  - legend  → 레전드 슬롯 교체
 *  - champion → 챔피언 슬롯이 비었고 색이 맞으면 슬롯, 아니면 메인덱 +1
 *  - 그 외   → 해당 존 entries +1
 */
export type AddAction =
  | { kind: "legend"; id: string }
  | { kind: "champion"; id: string }
  | { kind: "entry"; id: string }
  | { kind: "blocked"; reason: string };

export function planAdd(deck: Deck, rd: ResolvedDeck, card: Card): AddAction {
  if (card.type === "legend") return { kind: "legend", id: card.id };

  if (!matchesIdentity(rd, card)) return { kind: "blocked", reason: "덱 색과 다릅니다" };

  if (card.type === "champion") {
    // 레전드와 같은 이름의 챔피언 + 지정 슬롯이 비었으면 슬롯으로.
    // 그 외 챔피언(다른 이름 / 슬롯 참)은 색만 맞으면 메인덱 카드로 넣는다.
    if (matchesLegendChampion(rd, card) && !rd.champion) return { kind: "champion", id: card.id };
  }

  const zone = entryZoneOf(card.type);
  // 이름당 최대 3장 (룬 제외). "이름" = 전체 이름(부제 포함) → 부제가 다르면 다른 카드.
  // 리더 챔피언 슬롯의 카드도 같은 이름이면 1장으로 카운트한다.
  const sameNameInZone = rd.sections[zone]
    .filter((e) => e.card.name === card.name)
    .reduce((s, e) => s + e.qty, 0);
  const leaderSameName = rd.champion && rd.champion.name === card.name ? 1 : 0;
  if (zone !== "rune" && sameNameInZone + leaderSameName >= DECK_RULES.maxCopies)
    return {
      kind: "blocked",
      reason: `이름당 최대 ${DECK_RULES.maxCopies}장${leaderSameName ? " (리더 포함)" : ""}`,
    };
  if (zone === "main" && zoneCounts(rd).main >= DECK_RULES.mainMax)
    return { kind: "blocked", reason: `메인덱은 ${DECK_RULES.mainMax}장까지` };
  if (zone === "rune" && zoneCounts(rd).rune >= DECK_RULES.runeCount)
    return { kind: "blocked", reason: `룬은 ${DECK_RULES.runeCount}장 (레전드 색 자동)` };
  if (
    zone === "battlefield" &&
    zoneCounts(rd).battlefield >= DECK_RULES.battlefieldCount &&
    !rd.sections.battlefield.some((e) => e.card.id === card.id)
  )
    return { kind: "blocked", reason: `전장은 ${DECK_RULES.battlefieldCount}장까지` };

  return { kind: "entry", id: card.id };
}

export { ZONE_META };
