import type { Card } from "@/lib/types/card";
import { DECK_RULES } from "@/lib/constants";
import {
  type Deck,
  type DeckZone,
  type ResolvedDeck,
  type ResolvedEntry,
  SIDE_TYPES,
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

/** 사이드덱 장수 증감 (0 이하가 되면 제거). */
export function addSide(deck: Deck, id: string, delta = 1): Deck {
  const side = [...(deck.side ?? [])];
  const i = side.findIndex((e) => e.id === id);
  if (i === -1) {
    if (delta <= 0) return deck;
    side.push({ id, qty: delta });
  } else {
    const qty = side[i].qty + delta;
    if (qty <= 0) side.splice(i, 1);
    else side[i] = { ...side[i], qty };
  }
  return { ...deck, side };
}

export function renameDeck(deck: Deck, name: string): Deck {
  return { ...deck, name: name.slice(0, 60) };
}

export function clearDeck(deck: Deck): Deck {
  return { ...deck, legendId: null, championId: null, entries: [], side: [] };
}

// ── 해석 ───────────────────────────────────────────────────────

export function resolveDeck(deck: Deck, pool: Map<string, Card>): ResolvedDeck {
  const sections: ResolvedDeck["sections"] = { battlefield: [], rune: [], main: [] };
  for (const e of deck.entries) {
    const card = pool.get(e.id);
    if (!card) continue;
    sections[entryZoneOf(card.type)].push({ card, qty: e.qty });
  }
  const side: ResolvedEntry[] = [];
  for (const e of deck.side ?? []) {
    const card = pool.get(e.id);
    if (card) side.push({ card, qty: e.qty });
  }
  const byCurve = (a: ResolvedEntry, b: ResolvedEntry) =>
    (a.card.cost ?? 99) - (b.card.cost ?? 99) ||
    (b.card.power ?? -1) - (a.card.power ?? -1) ||
    a.card.name.localeCompare(b.card.name, "en");
  sections.battlefield.sort(byCurve);
  sections.rune.sort(byCurve);
  sections.main.sort(byCurve);
  side.sort(byCurve);

  return {
    name: deck.name,
    legend: (deck.legendId && pool.get(deck.legendId)) || null,
    champion: (deck.championId && pool.get(deck.championId)) || null,
    sections,
    side,
  };
}

/** 사이드덱 총 장수. (`totalCards`/`zoneCounts` 에는 포함하지 않는다.) */
export function sideCount(rd: ResolvedDeck): number {
  return rd.side.reduce((s, e) => s + e.qty, 0);
}

/** 이름(부제 포함)이 같은 카드의 주 덱 + 사이드덱 합계. 이름당 최대 3장은 둘을 합산한다. */
function nameTotal(rd: ResolvedDeck, name: string): number {
  const main = rd.sections.main.filter((e) => e.card.name === name).reduce((s, e) => s + e.qty, 0);
  const side = rd.side.filter((e) => e.card.name === name).reduce((s, e) => s + e.qty, 0);
  return main + side;
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

/** 전설(없으면 챔피언)의 영역 = 덱 색 정체성. */
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
 * 선발 챔피언은 전설과 같은 챔피언 이름이어야 한다.
 * (전설 "Jinx - Loose Cannon" → 챔피언은 "Jinx - …" 만)
 */
export function matchesLegendChampion(rd: ResolvedDeck, card: Card): boolean {
  if (card.type !== "champion") return true;
  if (!rd.legend) return true; // 전설 미정이면 제한 없음
  return championName(card.localization.en.name) === championName(rd.legend.localization.en.name);
}

/** 시그니처 카드는 전설과 같은 챔피언 태그를 가져야 한다. 시그니처가 아니면 항상 통과. */
export function matchesSignatureLegend(rd: ResolvedDeck, card: Card): boolean {
  if (card.supertype !== "signature") return true;
  if (!rd.legend) return true; // 전설 미정이면 제한 없음
  return card.subtypes.some((t) => rd.legend!.subtypes.includes(t));
}

/** 주 덱 + 사이드덱의 시그니처 카드 총 장수(이름 무관 합산) — 최대 {@link DECK_RULES.maxCopies}장. */
export function signatureCount(rd: ResolvedDeck): number {
  return [...rd.sections.main, ...rd.side]
    .filter((e) => e.card.supertype === "signature")
    .reduce((s, e) => s + e.qty, 0);
}

// ── 검증 ───────────────────────────────────────────────────────

export interface DeckIssue {
  level: "error" | "warn";
  message: string;
}

export function validateDeck(rd: ResolvedDeck): DeckIssue[] {
  const issues: DeckIssue[] = [];
  const c = zoneCounts(rd);

  if (!rd.legend) issues.push({ level: "warn", message: "전설을 선택하세요." });
  if (!rd.champion) issues.push({ level: "warn", message: "선발 챔피언을 선택하세요." });
  if (c.main !== DECK_RULES.mainMin)
    issues.push({
      level: c.main === 0 ? "warn" : "error",
      message: `주 덱은 정확히 ${DECK_RULES.mainMin}장이어야 합니다 (현재 ${c.main}장).`,
    });
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

  // 사이드덱 — 0장 또는 정확히 10장, 주 덱과 같은 종류의 카드만.
  const sideN = sideCount(rd);
  if (sideN !== 0 && sideN !== DECK_RULES.sideCount)
    issues.push({
      level: "error",
      message: `사이드덱은 0장 또는 정확히 ${DECK_RULES.sideCount}장이어야 합니다 (현재 ${sideN}장).`,
    });
  for (const e of rd.side)
    if (!SIDE_TYPES.includes(e.card.type) || e.card.supertype === "token")
      issues.push({
        level: "error",
        message: `"${e.card.name}" 은(는) 사이드덱에 넣을 수 없는 카드입니다.`,
      });

  // 이름당 최대 3장 — 부제가 다르면 다른 카드. 선발 챔피언 슬롯·사이드덱도 합산.
  const mainByName = new Map<string, number>();
  for (const e of [...rd.sections.main, ...rd.side])
    mainByName.set(e.card.name, (mainByName.get(e.card.name) ?? 0) + e.qty);
  if (rd.champion) mainByName.set(rd.champion.name, (mainByName.get(rd.champion.name) ?? 0) + 1);
  for (const [name, total] of mainByName) {
    if (total > DECK_RULES.maxCopies)
      issues.push({
        level: "error",
        message: `"${name}" ${total}장 (리더 포함) — 이름당 최대 ${DECK_RULES.maxCopies}장.`,
      });
  }

  // 시그니처 — 이름 무관 총 3장, 전설과 챔피언 태그가 달라도 금지.
  const sigTotal = signatureCount(rd);
  if (sigTotal > DECK_RULES.maxCopies)
    issues.push({
      level: "error",
      message: `시그니처 카드는 이름과 무관하게 총 ${DECK_RULES.maxCopies}장까지 (현재 ${sigTotal}장).`,
    });
  for (const e of [...rd.sections.main, ...rd.side])
    if (!matchesSignatureLegend(rd, e.card))
      issues.push({
        level: "error",
        message: `"${e.card.name}" 은(는) 전설(${rd.legend?.name ?? "미정"})의 챔피언 태그와 다른 시그니처입니다.`,
      });

  // 토큰 — 카드 효과로만 생기는 카드라 덱 구성에 넣을 수 없다.
  for (const zone of ["battlefield", "rune", "main"] as const)
    for (const e of rd.sections[zone])
      if (e.card.supertype === "token")
        issues.push({ level: "error", message: `"${e.card.name}" 은(는) 토큰 카드라 덱에 넣을 수 없습니다.` });

  if (rd.legend || rd.champion) {
    const all: Card[] = [
      ...(rd.champion ? [rd.champion] : []),
      ...rd.sections.battlefield.map((e) => e.card),
      ...rd.sections.rune.map((e) => e.card),
      ...rd.sections.main.map((e) => e.card),
      ...rd.side.map((e) => e.card),
    ];
    for (const card of all)
      if (!matchesIdentity(rd, card))
        issues.push({ level: "error", message: `"${card.name}" 은(는) 덱 색이 아닙니다.` });
  }

  if (rd.champion && rd.legend && !matchesLegendChampion(rd, rd.champion))
    issues.push({
      level: "error",
      message: `선발 챔피언은 전설(${rd.legend.name})와 같은 챔피언이어야 합니다.`,
    });
  // 주 덱의 다른 챔피언 유닛은 색만 맞으면 허용 (위 색 검증에서 이미 처리됨).

  return issues;
}

/**
 * 풀에서 카드를 눌렀을 때의 동작 결정.
 *  - legend  → 전설 슬롯 교체
 *  - champion → 챔피언 슬롯이 비었고 색이 맞으면 슬롯, 아니면 주 덱 +1
 *  - 그 외   → 해당 존 entries +1
 */
export type AddAction =
  | { kind: "legend"; id: string }
  | { kind: "champion"; id: string }
  | { kind: "entry"; id: string }
  | { kind: "side"; id: string }
  | { kind: "blocked"; reason: string };

/** `target: "side"` 면 사이드덱에 넣는 규칙(전설·슬롯 없음, 10장 상한)으로 판정. */
export function planAdd(
  deck: Deck,
  rd: ResolvedDeck,
  card: Card,
  target: "main" | "side" = "main",
): AddAction {
  if (target === "side") return planAddSide(rd, card);

  if (card.type === "legend") return { kind: "legend", id: card.id };

  if (card.supertype === "token") return { kind: "blocked", reason: "토큰 카드는 덱에 넣을 수 없습니다" };

  if (!matchesIdentity(rd, card)) return { kind: "blocked", reason: "덱 색과 다릅니다" };

  if (!matchesSignatureLegend(rd, card))
    return { kind: "blocked", reason: "전설의 챔피언 태그와 다른 시그니처입니다" };

  if (card.type === "champion") {
    // 전설과 같은 이름의 챔피언 + 선발 슬롯이 비었으면 슬롯으로.
    // 그 외 챔피언(다른 이름 / 슬롯 참)은 색만 맞으면 주 덱 카드로 넣는다.
    if (matchesLegendChampion(rd, card) && !rd.champion) return { kind: "champion", id: card.id };
  }

  const zone = entryZoneOf(card.type);
  // 시그니처는 이름 무관 총 3장(다른 시그니처 이름과 합산).
  if (card.supertype === "signature" && signatureCount(rd) >= DECK_RULES.maxCopies)
    return { kind: "blocked", reason: `시그니처는 이름과 무관하게 총 ${DECK_RULES.maxCopies}장까지` };

  // 이름당 최대 3장 (룬 제외). "이름" = 전체 이름(부제 포함) → 부제가 다르면 다른 카드.
  // 선발 챔피언 슬롯의 카드도 같은 이름이면 1장으로 카운트한다.
  // 주 덱 카드는 사이드덱에 있는 같은 이름 카드도 합산한다.
  const sameNameInZone =
    zone === "main"
      ? nameTotal(rd, card.name)
      : rd.sections[zone]
          .filter((e) => e.card.name === card.name)
          .reduce((s, e) => s + e.qty, 0);
  const leaderSameName = rd.champion && rd.champion.name === card.name ? 1 : 0;
  if (zone !== "rune" && sameNameInZone + leaderSameName >= DECK_RULES.maxCopies)
    return {
      kind: "blocked",
      reason: `이름당 최대 ${DECK_RULES.maxCopies}장${leaderSameName ? " (리더 포함)" : ""}`,
    };
  if (zone === "main" && zoneCounts(rd).main >= DECK_RULES.mainMax)
    return { kind: "blocked", reason: `주 덱은 ${DECK_RULES.mainMax}장까지` };
  if (zone === "rune" && zoneCounts(rd).rune >= DECK_RULES.runeCount)
    return { kind: "blocked", reason: `룬은 ${DECK_RULES.runeCount}장 (전설 색 자동)` };
  if (
    zone === "battlefield" &&
    zoneCounts(rd).battlefield >= DECK_RULES.battlefieldCount &&
    !rd.sections.battlefield.some((e) => e.card.id === card.id)
  )
    return { kind: "blocked", reason: `전장은 ${DECK_RULES.battlefieldCount}장까지` };

  return { kind: "entry", id: card.id };
}

function planAddSide(rd: ResolvedDeck, card: Card): AddAction {
  if (!SIDE_TYPES.includes(card.type))
    return { kind: "blocked", reason: "사이드덱은 유닛·주문·도구·챔피언만 넣을 수 있습니다" };
  if (card.supertype === "token") return { kind: "blocked", reason: "토큰 카드는 덱에 넣을 수 없습니다" };
  if (!matchesIdentity(rd, card)) return { kind: "blocked", reason: "덱 색과 다릅니다" };
  if (!matchesSignatureLegend(rd, card))
    return { kind: "blocked", reason: "전설의 챔피언 태그와 다른 시그니처입니다" };
  if (card.supertype === "signature" && signatureCount(rd) >= DECK_RULES.maxCopies)
    return { kind: "blocked", reason: `시그니처는 이름과 무관하게 총 ${DECK_RULES.maxCopies}장까지` };

  const leaderSameName = rd.champion && rd.champion.name === card.name ? 1 : 0;
  if (nameTotal(rd, card.name) + leaderSameName >= DECK_RULES.maxCopies)
    return {
      kind: "blocked",
      reason: `이름당 최대 ${DECK_RULES.maxCopies}장 (주 덱 합산${leaderSameName ? ", 리더 포함" : ""})`,
    };
  if (sideCount(rd) >= DECK_RULES.sideCount)
    return { kind: "blocked", reason: `사이드덱은 ${DECK_RULES.sideCount}장까지` };
  return { kind: "side", id: card.id };
}

export { ZONE_META };
