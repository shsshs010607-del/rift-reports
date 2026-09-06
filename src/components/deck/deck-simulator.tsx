"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Sparkles, Trash2 } from "lucide-react";

import type { Card } from "@/lib/types/card";
import type { Deck } from "@/lib/types/deck";
import { encodeDeck, decodeDeck } from "@/lib/deck/deck-code";
import {
  addCard,
  clearDeck,
  renameDeck,
  resolveEntries,
  validateDeck,
  mainCount,
  zoneCount,
} from "@/lib/deck/deck-model";
import { CardPicker } from "@/components/deck/card-picker";
import { DeckPanel } from "@/components/deck/deck-panel";
import { OpeningHandModal } from "@/components/deck/opening-hand-modal";

const LS_KEY = "rr:deck-simulator:last";

export function DeckSimulator({
  initialDeck,
  initialCards,
}: {
  initialDeck: Deck;
  initialCards: Card[];
}) {
  const router = useRouter();

  const [deck, setDeck] = useState<Deck>(initialDeck);
  const [handOpen, setHandOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // id → Card 캐시. URL 덱의 해석 결과 + 검색으로 만난 카드가 쌓인다.
  const cacheRef = useRef<Map<string, Card>>(new Map(initialCards.map((c) => [c.id, c])));
  const registerCards = useCallback((cards: Card[]) => {
    for (const c of cards) cacheRef.current.set(c.id, c);
  }, []);

  // 최초 마운트: URL에 덱이 없고 localStorage에 저장된 덱이 있으면 복원
  const hydratedRef = useRef(false);
  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    if (initialDeck.entries.length > 0) return;
    try {
      const saved = localStorage.getItem(LS_KEY);
      const restored = saved && decodeDeck(saved);
      if (restored && restored.entries.length > 0) setDeck(restored);
    } catch {
      /* localStorage 접근 불가 — 무시 */
    }
  }, [initialDeck]);

  // 덱 변경 → URL(?deck=) 동기화 + localStorage 저장 (디바운스)
  const code = useMemo(() => encodeDeck(deck), [deck]);
  useEffect(() => {
    const t = setTimeout(() => {
      router.replace(code ? `/deck-simulator?deck=${code}` : "/deck-simulator", { scroll: false });
      try {
        if (code) localStorage.setItem(LS_KEY, code);
        else localStorage.removeItem(LS_KEY);
      } catch {
        /* 무시 */
      }
    }, 400);
    return () => clearTimeout(t);
  }, [code, router]);

  const resolved = useMemo(() => resolveEntries(deck, cacheRef.current), [deck]);
  const issues = useMemo(() => validateDeck(resolved), [resolved]);
  const errorCount = issues.filter((i) => i.level === "error").length;

  const total = resolved.reduce((s, e) => s + e.qty, 0);
  const main = mainCount(resolved);
  const runes = zoneCount(resolved, "rune");

  const handleAdd = useCallback((card: Card, delta = 1) => {
    cacheRef.current.set(card.id, card);
    setDeck((d) => addCard(d, card.id, delta));
  }, []);

  async function copyShareLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* 클립보드 불가 — 무시 */
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* 헤더: 덱 이름 + 요약 + 액션 */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-card p-3">
        <input
          value={deck.name}
          onChange={(e) => setDeck((d) => renameDeck(d, e.target.value))}
          aria-label="덱 이름"
          className="min-w-0 flex-1 rounded-xl border border-line bg-subcanvas/50 px-3 py-2 text-title-md font-bold text-ink focus:border-primary focus:outline-none"
        />
        <div className="flex items-center gap-1.5 text-body-sm text-ink-soft">
          <span className={main >= 40 ? "text-emerald" : "text-ink-soft"}>메인 {main}</span>
          <span className="text-line">·</span>
          <span className={runes === 12 ? "text-emerald" : "text-ink-soft"}>룬 {runes}</span>
          <span className="text-line">·</span>
          <span>총 {total}장</span>
          {errorCount > 0 && (
            <span className="rounded-full bg-error/10 px-2 py-0.5 text-label-sm font-bold text-error">
              규칙 위반 {errorCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setHandOpen(true)}
            disabled={main === 0}
            className="btn-primary !py-2 !text-label-md disabled:opacity-40"
          >
            <Sparkles className="h-4 w-4" />
            오프닝 핸드
          </button>
          <button
            type="button"
            onClick={copyShareLink}
            className="btn-ghost !py-2 !text-label-md"
            title="공유 링크 복사"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "복사됨" : "공유"}
          </button>
          <button
            type="button"
            onClick={() => setDeck((d) => clearDeck(d))}
            disabled={deck.entries.length === 0}
            className="grid h-9 w-9 place-items-center rounded-full border border-line text-ink-soft hover:text-error disabled:opacity-40"
            title="덱 비우기"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_minmax(320px,380px)]">
        <CardPicker resolved={resolved} onAdd={handleAdd} onResults={registerCards} />
        <DeckPanel resolved={resolved} issues={issues} onChange={handleAdd} />
      </div>

      {handOpen && (
        <OpeningHandModal resolved={resolved} deckName={deck.name} onClose={() => setHandOpen(false)} />
      )}
    </div>
  );
}
