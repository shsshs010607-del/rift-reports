import type { Deck, DeckEntry } from "@/lib/types/deck";
import { EMPTY_DECK } from "@/lib/types/deck";
import { CARD_SET_CODES } from "@/lib/types/card";

/**
 * 덱 ↔ URL 문자열 인코딩.
 * 형식(JSON): { n: 이름, l: 레전드id, c: 챔피언id, e: [[id, qty], ...] }  →  base64url
 * 서버/클라이언트 공용 (Buffer 없이 atob/btoa).
 */

interface Packed {
  n: string;
  l: string | null;
  c: string | null;
  e: [string, number][];
}

function toBase64Url(s: string): string {
  return btoa(unescape(encodeURIComponent(s)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromBase64Url(s: string): string {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (s.length % 4)) % 4);
  return decodeURIComponent(escape(atob(b64)));
}

export function isDeckEmpty(deck: Deck): boolean {
  return !deck.legendId && !deck.championId && deck.entries.length === 0;
}

export function encodeDeck(deck: Deck): string {
  if (isDeckEmpty(deck) && deck.name === EMPTY_DECK.name) return "";
  const packed: Packed = {
    n: deck.name.slice(0, 60),
    l: deck.legendId,
    c: deck.championId,
    e: deck.entries.filter((x) => x.qty > 0).map((x) => [x.id, x.qty]),
  };
  return toBase64Url(JSON.stringify(packed));
}

export function decodeDeck(param: string | null | undefined): Deck | null {
  if (!param) return null;
  try {
    const p = JSON.parse(fromBase64Url(param)) as Partial<Packed>;
    if (!Array.isArray(p.e)) return null;
    const seen = new Set<string>();
    const entries: DeckEntry[] = [];
    for (const pair of p.e) {
      if (!Array.isArray(pair)) continue;
      const [id, qty] = pair;
      if (typeof id !== "string" || !id || seen.has(id)) continue;
      seen.add(id);
      entries.push({ id, qty: Math.max(1, Math.min(99, Math.floor(Number(qty) || 0))) });
    }
    return {
      name: typeof p.n === "string" && p.n.trim() ? p.n.slice(0, 60) : EMPTY_DECK.name,
      legendId: typeof p.l === "string" && p.l ? p.l : null,
      championId: typeof p.c === "string" && p.c ? p.c : null,
      entries,
    };
  } catch {
    return null;
  }
}

// ────────────────────────────────────────────────────────────────────────────
//  짧은 덱 코드  (rr1.<레전드>.<챔피언>.<카드ref>q<수량>-...)
//  카드 ref = 세트 1글자(A=CARD_SET_CODES[0], B=[1]...) + 수집번호.  이름은 안 담음.
// ────────────────────────────────────────────────────────────────────────────

const CODE_PREFIX = "rr1";
const SET_LETTER = new Map<string, string>(
  CARD_SET_CODES.map((c, i) => [c, String.fromCharCode(65 + i)]),
);

type RefCard = { id: string; setCode: string; collectorNumber: string | null };

export interface DeckRefMaps {
  refById: Map<string, string>;
  idByRef: Map<string, string>;
}

/** 카드 목록 → { id↔ref } 양방향 맵. */
export function buildDeckRefMaps(cards: RefCard[]): DeckRefMaps {
  const refById = new Map<string, string>();
  const idByRef = new Map<string, string>();
  for (const c of cards) {
    const num = (c.collectorNumber ?? "").replace(/\D+/g, "");
    const letter = SET_LETTER.get(c.setCode);
    if (!num || !letter) continue;
    const ref = `${letter}${num}`;
    refById.set(c.id, ref);
    if (!idByRef.has(ref)) idByRef.set(ref, c.id);
  }
  return { refById, idByRef };
}

/** 짧은 덱 코드. 참조를 못 만드는 카드가 있으면 null (호출부에서 base64 폴백). */
export function encodeDeckCode(deck: Deck, refById: Map<string, string>): string | null {
  const refOf = (id: string | null): string | null =>
    id === null ? "_" : refById.get(id) ?? null;
  const l = refOf(deck.legendId);
  const c = refOf(deck.championId);
  if (l === null || c === null) return null;

  const parts: string[] = [];
  for (const e of deck.entries) {
    if (e.qty <= 0) continue;
    const r = refById.get(e.id);
    if (!r) return null;
    parts.push(`${r}q${e.qty}`);
  }
  return [CODE_PREFIX, l, c, parts.join("-")].join(".");
}

export function isDeckCode(s: string | null | undefined): boolean {
  return typeof s === "string" && s.startsWith(CODE_PREFIX + ".");
}

export function decodeDeckCode(
  code: string | null | undefined,
  idByRef: Map<string, string>,
): Deck | null {
  if (!isDeckCode(code)) return null;
  const [, l, c, list = ""] = code!.trim().split(".");
  const idOf = (ref?: string) => (!ref || ref === "_" ? null : idByRef.get(ref) ?? null);

  const seen = new Set<string>();
  const entries: DeckEntry[] = [];
  for (const tok of list.split("-").filter(Boolean)) {
    const m = tok.match(/^([A-Z]\d+)q(\d+)$/);
    if (!m) continue;
    const id = idByRef.get(m[1]);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    entries.push({ id, qty: Math.max(1, Math.min(99, Math.floor(Number(m[2])) || 1)) });
  }
  return { name: EMPTY_DECK.name, legendId: idOf(l), championId: idOf(c), entries };
}

/** 덱의 모든 카드 id (레전드·챔피언·entries) — 서버에서 한 번에 해석할 때. */
export function deckCardIds(deck: Deck): string[] {
  const ids = new Set<string>();
  if (deck.legendId) ids.add(deck.legendId);
  if (deck.championId) ids.add(deck.championId);
  for (const e of deck.entries) ids.add(e.id);
  return [...ids];
}
