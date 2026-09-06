import type { Deck, DeckEntry } from "@/lib/types/deck";
import { EMPTY_DECK } from "@/lib/types/deck";

/**
 * 덱 ↔ URL 문자열 인코딩.
 *
 * 형식(JSON): { n: 이름, e: [[id, qty], ...] }  →  base64url
 * 서버/클라이언트 양쪽에서 쓰므로 Buffer 없이 atob/btoa 만 사용(Node 18+ 전역).
 */

interface Packed {
  n: string;
  e: [string, number][];
}

function toBase64Url(s: string): string {
  return btoa(unescape(encodeURIComponent(s))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string): string {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (s.length % 4)) % 4);
  return decodeURIComponent(escape(atob(b64)));
}

/** 덱 → `?deck=` 파라미터 값. 빈 덱이면 빈 문자열. */
export function encodeDeck(deck: Deck): string {
  if (deck.entries.length === 0 && deck.name === EMPTY_DECK.name) return "";
  const packed: Packed = {
    n: deck.name.slice(0, 60),
    e: deck.entries.filter((x) => x.qty > 0).map((x) => [x.id, x.qty]),
  };
  return toBase64Url(JSON.stringify(packed));
}

/** `?deck=` 값 → 덱. 형식이 깨졌으면 null. */
export function decodeDeck(param: string | null | undefined): Deck | null {
  if (!param) return null;
  try {
    const packed = JSON.parse(fromBase64Url(param)) as Partial<Packed>;
    if (!Array.isArray(packed.e)) return null;
    const seen = new Set<string>();
    const entries: DeckEntry[] = [];
    for (const pair of packed.e) {
      if (!Array.isArray(pair)) continue;
      const [id, qty] = pair;
      if (typeof id !== "string" || !id || seen.has(id)) continue;
      const n = Math.max(1, Math.min(99, Math.floor(Number(qty) || 0)));
      seen.add(id);
      entries.push({ id, qty: n });
    }
    return {
      name: typeof packed.n === "string" && packed.n.trim() ? packed.n.slice(0, 60) : EMPTY_DECK.name,
      entries,
    };
  } catch {
    return null;
  }
}
