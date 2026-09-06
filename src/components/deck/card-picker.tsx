"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Plus, Search } from "lucide-react";

import type { Card } from "@/lib/types/card";
import type { ResolvedEntry } from "@/lib/types/deck";
import { canAdd, legendDomains } from "@/lib/deck/deck-model";
import { CARD_DOMAINS, CARD_SETS, CARD_TYPES } from "@/lib/constants";
import { cn } from "@/lib/utils";

type ApiResponse = { count: number; cards: Card[] };

const LIMIT = 60;

/**
 * 덱 빌더 좌측 패널 — 카드 검색(/api/cards) + 클릭해서 덱에 추가.
 * 검색은 어댑터 뒤의 API 라우트를 그대로 쓴다(데이터 소스 무관).
 */
export function CardPicker({
  resolved,
  onAdd,
  onResults,
}: {
  resolved: ResolvedEntry[];
  onAdd: (card: Card, delta?: number) => void;
  onResults: (cards: Card[]) => void;
}) {
  const [q, setQ] = useState("");
  const [domain, setDomain] = useState<string>("");
  const [type, setType] = useState<string>("");
  const [setCode, setSetCode] = useState<string>("");
  const [cards, setCards] = useState<Card[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const qtyById = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of resolved) m.set(e.card.id, e.qty);
    return m;
  }, [resolved]);

  const onResultsRef = useRef(onResults);
  onResultsRef.current = onResults;

  useEffect(() => {
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const sp = new URLSearchParams({ limit: String(LIMIT) });
        if (q.trim()) sp.set("q", q.trim());
        if (domain) sp.set("domain", domain);
        if (type) sp.set("type", type);
        if (setCode) sp.set("setCode", setCode);
        const res = await fetch(`/api/cards?${sp}`, { signal: ctrl.signal });
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as ApiResponse;
        setCards(data.cards);
        setCount(data.count);
        onResultsRef.current(data.cards);
      } catch (err) {
        if ((err as Error).name !== "AbortError") setError("카드를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      ctrl.abort();
      clearTimeout(t);
    };
  }, [q, domain, type, setCode]);

  const legendColors = legendDomains(resolved);
  const legendLabels = CARD_DOMAINS.filter((d) => legendColors.includes(d.slug));

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-line bg-card p-3">
      {/* 검색 */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="카드명 또는 효과 검색"
          className="field pl-9"
        />
      </div>

      {/* 필터: 도메인 · 타입 */}
      <div className="flex flex-wrap gap-1">
        <FilterChip active={!domain && !type} onClick={() => { setDomain(""); setType(""); }}>
          전체
        </FilterChip>
        {CARD_DOMAINS.map((d) => (
          <FilterChip
            key={d.slug}
            active={domain === d.slug}
            onClick={() => setDomain(domain === d.slug ? "" : d.slug)}
          >
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
            {d.label}
          </FilterChip>
        ))}
        {CARD_TYPES.map((t) => (
          <FilterChip
            key={t.slug}
            active={type === t.slug}
            onClick={() => setType(type === t.slug ? "" : t.slug)}
          >
            {t.label}
          </FilterChip>
        ))}
      </div>

      {/* 필터: 확장팩 */}
      <div className="flex flex-wrap gap-1">
        {CARD_SETS.map((s) => (
          <FilterChip
            key={s.code}
            active={setCode === s.code}
            onClick={() => setSetCode(setCode === s.code ? "" : s.code)}
          >
            <span className="font-mono text-[11px] font-bold">{s.code}</span>
            {s.label}
          </FilterChip>
        ))}
      </div>

      <div className="flex items-center justify-between gap-2">
        <p className="text-label-sm text-ink-soft">
          {loading ? "검색 중…" : error ? error : `${count.toLocaleString("ko-KR")}장`}
        </p>
        {legendLabels.length > 0 && (
          <p className="flex items-center gap-1 text-label-sm text-ink-soft">
            레전드 색:
            {legendLabels.map((d) => (
              <span key={d.slug} className="inline-flex items-center gap-1 font-semibold text-ink">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                {d.label}
              </span>
            ))}
            <span className="text-ink-soft">만 추가 가능</span>
          </p>
        )}
      </div>

      {/* 결과 그리드 */}
      <ul className="grid max-h-[64vh] grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3">
        {cards.map((card) => {
          const inDeck = qtyById.get(card.id) ?? 0;
          const addable = canAdd(resolved, card);
          return (
            <li key={card.id}>
              <button
                type="button"
                onClick={() => addable.ok && onAdd(card, 1)}
                disabled={!addable.ok}
                title={addable.ok ? "덱에 추가" : addable.reason}
                className={cn(
                  "group relative block w-full overflow-hidden rounded-xl border border-line bg-subcanvas text-left transition",
                  addable.ok ? "hover:border-primary/50" : "cursor-not-allowed opacity-50",
                )}
              >
                <div className="relative aspect-[5/7]">
                  {card.imageUrl ? (
                    <Image
                      src={card.imageUrl}
                      alt={card.name}
                      fill
                      sizes="160px"
                      className="object-cover"
                    />
                  ) : (
                    <span className="grid h-full place-items-center p-1 text-center text-label-sm text-ink-soft">
                      {card.name}
                    </span>
                  )}
                  {typeof card.cost === "number" && (
                    <span className="absolute left-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-ink/80 text-label-sm font-bold text-card">
                      {card.cost}
                    </span>
                  )}
                  {inDeck > 0 && (
                    <span className="absolute right-1 top-1 rounded-full bg-primary px-1.5 text-label-sm font-bold text-white">
                      ×{inDeck}
                    </span>
                  )}
                  {addable.ok && (
                    <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-primary/90 py-1 text-label-sm font-bold text-white opacity-0 transition group-hover:opacity-100">
                      <Plus className="h-3 w-3" /> 추가
                    </span>
                  )}
                </div>
                <p className="truncate px-1.5 py-1 text-label-sm text-ink">{card.name}</p>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-label-sm transition",
        active
          ? "border-primary bg-primary/10 font-bold text-primary-strong"
          : "border-line text-ink-soft hover:border-primary/40",
      )}
    >
      {children}
    </button>
  );
}
