"use client";

import { useState } from "react";
import { Loader2, X } from "lucide-react";

import type { Card } from "@/lib/types/card";
import { type Deck, EMPTY_DECK, entryZoneOf } from "@/lib/types/deck";
import { decodeDeck, decodeDeckCode, buildDeckRefMaps } from "@/lib/deck/deck-code";
import { deckCardIds } from "@/lib/deck/deck-code";
import { parseDecklist, type TextSection } from "@/lib/deck/deck-text";

/**
 * 덱 가져오기: 공유 URL / 덱 코드 / 텍스트 디코드 붙여넣기.
 * 텍스트는 카드명을 /api/cards 로 조회해 id 로 해석한다(정확 일치 우선).
 */
export function ImportDialog({
  current,
  onCache,
  onApply,
  onClose,
}: {
  current: Deck;
  onCache: (cards: Card[]) => void;
  onApply: (deck: Deck) => void;
  onClose: () => void;
}) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState<string | null>(null);

  async function resolveName(name: string): Promise<Card | null> {
    try {
      const res = await fetch(`/api/cards?q=${encodeURIComponent(name)}&limit=8`);
      if (!res.ok) return null;
      const data = (await res.json()) as { cards: Card[] };
      const lower = name.toLowerCase();
      return (
        data.cards.find(
          (c) => c.name.toLowerCase() === lower || c.localization.en.name.toLowerCase() === lower,
        ) ??
        data.cards.find((c) => c.name.toLowerCase().startsWith(lower)) ??
        data.cards[0] ??
        null
      );
    } catch {
      return null;
    }
  }

  async function run() {
    setBusy(true);
    setReport(null);

    // 1) 짧은 덱 코드 (rr1.…) — URL 안에 있어도 인식
    const shortMatch =
      text.match(/[?&]d=(rr1\.[^&\s]+)/)?.[1] ?? text.trim().match(/(rr1\.\S+)/)?.[1];
    if (shortMatch) {
      try {
        const res = await fetch("/api/cards?limit=999");
        const data = (await res.json()) as { cards: Card[] };
        const { idByRef } = buildDeckRefMaps(data.cards);
        const decoded = decodeDeckCode(shortMatch, idByRef);
        if (decoded && (decoded.legendId || decoded.championId || decoded.entries.length > 0)) {
          const wanted = new Set(deckCardIds(decoded));
          onCache(data.cards.filter((c) => wanted.has(c.id)));
          onApply({ ...decoded, name: current.name });
          return;
        }
      } catch {
        /* 폴백 계속 */
      }
    }

    // 2) 구버전 URL / base64 덱 코드
    const codeMatch = text.match(/[?&]deck=([^&\s]+)/) ?? text.trim().match(/^([A-Za-z0-9_-]{16,})$/);
    if (codeMatch) {
      const decoded = decodeDeck(codeMatch[1]);
      if (decoded) {
        onApply(decoded);
        return;
      }
    }

    // 2) 텍스트 디코드
    const parsed = parseDecklist(text);
    const names = new Set<string>();
    if (parsed.legendName) names.add(parsed.legendName);
    if (parsed.championName) names.add(parsed.championName);
    for (const l of parsed.lines) names.add(l.name);

    const found = new Map<string, Card>();
    const missing: string[] = [];
    for (const n of names) {
      const card = await resolveName(n);
      if (card) found.set(n.toLowerCase(), card);
      else missing.push(n);
    }
    onCache([...found.values()]);

    const deck: Deck = {
      ...EMPTY_DECK,
      name: parsed.name ?? current.name,
      entries: [],
    };
    const legend = parsed.legendName && found.get(parsed.legendName.toLowerCase());
    const champion = parsed.championName && found.get(parsed.championName.toLowerCase());
    if (legend) deck.legendId = legend.id;
    if (champion) deck.championId = champion.id;

    const byId = new Map<string, number>();
    const wrongSection: string[] = [];
    for (const l of parsed.lines) {
      const card = found.get(l.name.toLowerCase());
      if (!card) continue;
      if (card.type === "legend") {
        deck.legendId = card.id;
        continue;
      }
      const actual: TextSection = entryZoneOf(card.type);
      if (l.section !== actual && !(l.section === "main" && actual === "main"))
        wrongSection.push(`${card.name}(→${actual})`);
      byId.set(card.id, (byId.get(card.id) ?? 0) + l.qty);
    }
    deck.entries = [...byId].map(([id, qty]) => ({ id, qty: Math.min(qty, 12) }));

    if (deck.entries.length === 0 && !deck.legendId && !deck.championId) {
      setReport("덱을 해석하지 못했습니다. 형식을 확인하세요.");
      setBusy(false);
      return;
    }

    const notes: string[] = [];
    if (missing.length) notes.push(`못 찾음: ${missing.slice(0, 6).join(", ")}${missing.length > 6 ? " 외" : ""}`);
    if (notes.length) {
      setReport(notes.join(" · ") + " — 나머지는 적용합니다.");
      // 잠깐 보여주고 적용
      setTimeout(() => onApply(deck), 1200);
      return;
    }
    onApply(deck);
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-scrim/55 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="flex w-full max-w-lg flex-col gap-3 rounded-2xl border border-line bg-card p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-display text-title-md font-bold text-ink">덱 가져오기</h2>
            <p className="text-body-sm text-ink-soft">공유 링크, 덱 코드, 또는 텍스트 덱리스트를 붙여넣으세요.</p>
          </div>
          <button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full bg-subcanvas text-ink-soft hover:text-ink">
            <X className="h-4 w-4" />
          </button>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={10}
          placeholder={"레전드: Jinx - Loose Cannon\n챔피언: Jinx - Demolitionist\n룬:\n6 Fury Rune\n6 Chaos Rune\n메인덱:\n3 ...\n\n또는 https://.../deck-simulator?deck=..."}
          className="w-full resize-none rounded-xl border border-line bg-subcanvas/50 p-3 font-mono text-body-sm text-ink focus:border-primary focus:outline-none"
        />

        {report && <p className="text-label-sm text-ink-soft">{report}</p>}

        <div className="flex justify-end gap-1.5">
          <button type="button" onClick={onClose} className="btn-ghost !py-2 !text-label-md">
            취소
          </button>
          <button
            type="button"
            onClick={run}
            disabled={busy || !text.trim()}
            className="btn-primary !py-2 !text-label-md disabled:opacity-40"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            가져오기
          </button>
        </div>
      </div>
    </div>
  );
}
