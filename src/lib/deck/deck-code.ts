import type { Deck, DeckEntry } from "@/lib/types/deck";
import { EMPTY_DECK } from "@/lib/types/deck";

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

/** 덱의 모든 카드 id (레전드·챔피언·entries) — 서버에서 한 번에 해석할 때. */
export function deckCardIds(deck: Deck): string[] {
  const ids = new Set<string>();
  if (deck.legendId) ids.add(deck.legendId);
  if (deck.championId) ids.add(deck.championId);
  for (const e of deck.entries) ids.add(e.id);
  return [...ids];
}
