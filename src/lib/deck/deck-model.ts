import type { Card } from "@/lib/types/card";
import { DECK_RULES } from "@/lib/constants";
import {
  type Deck,
  type DeckZone,
  type ResolvedEntry,
  ZONE_LABELS,
  zoneOf,
} from "@/lib/types/deck";

/**
 * 덱 상태 순수 함수 모음 (React 밖에서도 테스트 가능).
 * 상태는 항상 새 객체로 반환한다(불변).
 */

// ── 뮤테이션 ────────────────────────────────────────────────────

export function addCard(deck: Deck, id: string, delta = 1): Deck {
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

export function setQty(deck: Deck, id: string, qty: number): Deck {
  const n = Math.floor(qty);
  const entries = deck.entries
    .map((e) => (e.id === id ? { ...e, qty: n } : e))
    .filter((e) => e.qty > 0);
  if (n > 0 && !entries.some((e) => e.id === id)) entries.push({ id, qty: n });
  return { ...deck, entries };
}

export function removeCard(deck: Deck, id: string): Deck {
  return { ...deck, entries: deck.entries.filter((e) => e.id !== id) };
}

export function renameDeck(deck: Deck, name: string): Deck {
  return { ...deck, name: name.slice(0, 60) };
}

export function clearDeck(deck: Deck): Deck {
  return { ...deck, entries: [] };
}

// ── 해석 / 파생값 ───────────────────────────────────────────────

/** 저장된 entries 를 카드 상세와 결합. 카드 풀에 없는 id 는 조용히 버린다. */
export function resolveEntries(deck: Deck, pool: Map<string, Card>): ResolvedEntry[] {
  const out: ResolvedEntry[] = [];
  for (const e of deck.entries) {
    const card = pool.get(e.id);
    if (!card) continue;
    out.push({ card, qty: e.qty, zone: zoneOf(card.type) });
  }
  return out;
}

export type ZoneGroups = Record<DeckZone, ResolvedEntry[]>;

export function groupByZone(entries: ResolvedEntry[]): ZoneGroups {
  const groups: ZoneGroups = { legend: [], main: [], rune: [], battlefield: [] };
  for (const e of entries) groups[e.zone].push(e);
  const byCurve = (a: ResolvedEntry, b: ResolvedEntry) =>
    (a.card.cost ?? 99) - (b.card.cost ?? 99) || a.card.name.localeCompare(b.card.name, "en");
  for (const z of Object.keys(groups) as DeckZone[]) groups[z].sort(byCurve);
  return groups;
}

export function zoneCount(entries: ResolvedEntry[], zone: DeckZone): number {
  return entries.filter((e) => e.zone === zone).reduce((s, e) => s + e.qty, 0);
}

/** 덱에 들어있는 레전드의 도메인(색). 없으면 빈 배열. */
export function legendDomains(entries: ResolvedEntry[]): string[] {
  const legend = entries.find((e) => e.zone === "legend");
  return legend ? legend.card.domains : [];
}

/**
 * 카드가 레전드의 색 정체성에 맞는지.
 * 레전드가 없으면 제한 없음. 무색 카드(도메인 없음)는 항상 허용.
 */
export function matchesLegendColor(entries: ResolvedEntry[], card: Card): boolean {
  if (card.type === "legend") return true;
  const legend = legendDomains(entries);
  if (legend.length === 0) return true; // 레전드 미지정 — 제한 없음
  if (card.domains.length === 0) return true; // 무색
  return card.domains.some((d) => legend.includes(d));
}

/** 메인덱 총 장수(레전드/룬/전장 제외). */
export function mainCount(entries: ResolvedEntry[]): number {
  return zoneCount(entries, "main");
}

// ── 검증 ───────────────────────────────────────────────────────

export interface DeckIssue {
  level: "error" | "warn";
  message: string;
}

export function validateDeck(entries: ResolvedEntry[]): DeckIssue[] {
  const issues: DeckIssue[] = [];
  const main = zoneCount(entries, "main");
  const legend = zoneCount(entries, "legend");
  const rune = zoneCount(entries, "rune");
  const bf = zoneCount(entries, "battlefield");

  if (main < DECK_RULES.mainMin)
    issues.push({ level: "error", message: `메인덱이 ${DECK_RULES.mainMin}장 미만입니다 (현재 ${main}장).` });
  if (legend > DECK_RULES.legendCount)
    issues.push({ level: "error", message: `레전드는 1장만 넣을 수 있습니다 (현재 ${legend}장).` });
  if (legend === 0)
    issues.push({ level: "warn", message: "레전드가 없습니다." });
  if (rune !== DECK_RULES.runeCount)
    issues.push({
      level: rune === 0 ? "warn" : "error",
      message: `룬덱은 정확히 ${DECK_RULES.runeCount}장이어야 합니다 (현재 ${rune}장).`,
    });
  if (bf > DECK_RULES.battlefieldCount)
    issues.push({ level: "error", message: `전장은 최대 ${DECK_RULES.battlefieldCount}장입니다 (현재 ${bf}장).` });

  for (const e of entries) {
    if (e.zone === "main" && e.qty > DECK_RULES.maxCopies)
      issues.push({
        level: "error",
        message: `"${e.card.name}" 이(가) ${e.qty}장입니다 — 이름당 최대 ${DECK_RULES.maxCopies}장.`,
      });
  }

  // 레전드 색 정체성 위반 (레전드를 나중에 바꾼 경우 등)
  if (legend > 0) {
    const offColor = entries.filter((e) => !matchesLegendColor(entries, e.card));
    for (const e of offColor)
      issues.push({
        level: "error",
        message: `"${e.card.name}" 은(는) 레전드의 색이 아닙니다.`,
      });
  }
  return issues;
}

/** 특정 카드를 1장 더 넣을 수 있는지(존별 상한). */
export function canAdd(entries: ResolvedEntry[], card: Card): { ok: boolean; reason?: string } {
  const zone = zoneOf(card.type);
  const current = entries.find((e) => e.card.id === card.id)?.qty ?? 0;

  if (current === 0 && !matchesLegendColor(entries, card))
    return { ok: false, reason: "레전드의 색만 넣을 수 있습니다" };

  if (zone === "main" && current >= DECK_RULES.maxCopies)
    return { ok: false, reason: `이름당 최대 ${DECK_RULES.maxCopies}장` };
  if (zone === "legend" && zoneCount(entries, "legend") >= DECK_RULES.legendCount && current === 0)
    return { ok: false, reason: "레전드는 1장" };
  if (zone === "battlefield" && zoneCount(entries, "battlefield") >= DECK_RULES.battlefieldCount && current === 0)
    return { ok: false, reason: `전장은 ${DECK_RULES.battlefieldCount}장까지` };
  if (zone === "rune" && zoneCount(entries, "rune") >= DECK_RULES.runeCount && current === 0)
    return { ok: false, reason: `룬덱은 ${DECK_RULES.runeCount}장` };
  return { ok: true };
}

export { ZONE_LABELS };
