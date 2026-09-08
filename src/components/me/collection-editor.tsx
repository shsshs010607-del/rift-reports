"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Search, Plus, Minus, X, Layers } from "lucide-react";

import type { Card } from "@/lib/types/card";
import { resolveCardText, cardNumber } from "@/lib/types/card";
import { setCollectionQty } from "@/app/me/collection-actions";
import { cn } from "@/lib/utils";

type Initial = { card_id: string; quantity: number }[];

export function CollectionEditor({ initial }: { initial: Initial }) {
  const [all, setAll] = useState<Card[]>([]);
  const [q, setQ] = useState("");
  const [qty, setQty] = useState<Record<string, number>>(
    () => Object.fromEntries(initial.map((i) => [i.card_id, i.quantity])),
  );
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    fetch("/api/cards?limit=1000")
      .then((r) => (r.ok ? r.json() : { cards: [] }))
      .then((d: { cards: Card[] }) => setAll(d.cards ?? []))
      .catch(() => setAll([]));
  }, []);

  const byId = useMemo(() => new Map(all.map((c) => [c.id, c])), [all]);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    return all
      .filter((c) => {
        const ko = resolveCardText(c, "ko");
        return (
          c.name.toLowerCase().includes(term) ||
          c.localization.en.name.toLowerCase().includes(term) ||
          (cardNumber(c) ?? "").toLowerCase().includes(term) ||
          ko.text.toLowerCase().includes(term)
        );
      })
      .slice(0, 24);
  }, [q, all]);

  const owned = useMemo(
    () =>
      Object.entries(qty)
        .filter(([, n]) => n > 0)
        .map(([id, n]) => ({ card: byId.get(id), id, n }))
        .sort((a, b) => (a.card?.name ?? a.id).localeCompare(b.card?.name ?? b.id, "ko")),
    [qty, byId],
  );
  const totalCards = owned.reduce((s, o) => s + o.n, 0);
  const distinct = owned.length;

  function save(id: string, next: number) {
    const clamped = Math.max(0, Math.min(999, next));
    setQty((p) => {
      const copy = { ...p };
      if (clamped === 0) delete copy[id];
      else copy[id] = clamped;
      return copy;
    });
    startTransition(() => {
      setCollectionQty(id, clamped);
    });
  }

  return (
    <section className="mt-8">
      <h2 className="mb-3 flex items-center gap-1.5 text-title-md font-bold text-ink">
        <Layers className="h-4 w-4 text-primary" />
        내 컬렉션
        <span className="text-body-sm font-normal text-ink-soft">
          {distinct}종 · {totalCards}장
        </span>
        {pending && <span className="text-label-sm font-normal text-ink-soft">저장 중…</span>}
      </h2>

      <div className="note-card p-4 pr-6">
        {/* 검색 */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="보유한 카드 검색해서 담기"
            className="w-full rounded-xl border border-line bg-card py-2.5 pl-10 pr-10 text-body-md text-ink placeholder:text-ink-soft/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {q.trim() && (
          <ul className="mt-3 flex flex-col divide-y divide-line/40">
            {all.length === 0 ? (
              <li className="py-3 text-center text-body-sm text-ink-soft">카드 불러오는 중…</li>
            ) : results.length === 0 ? (
              <li className="py-3 text-center text-body-sm text-ink-soft">검색 결과가 없습니다.</li>
            ) : (
              results.map((c) => (
                <li key={c.id} className="flex items-center gap-2 py-2">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-body-md text-ink">
                      {resolveCardText(c, "ko").name}
                    </span>
                    <span className="block text-label-sm text-ink-soft">
                      {cardNumber(c) ?? c.setCode}
                    </span>
                  </span>
                  <Stepper n={qty[c.id] ?? 0} onChange={(v) => save(c.id, v)} />
                </li>
              ))
            )}
          </ul>
        )}

        {/* 보유 목록 */}
        <div className="mt-4 border-t border-line/60 pt-3">
          <p className="mb-2 text-label-sm font-bold text-ink-soft">보유 카드</p>
          {owned.length === 0 ? (
            <p className="py-4 text-center text-body-sm text-ink-soft">
              아직 담은 카드가 없습니다. 위에서 검색해 수량을 넣어보세요.
            </p>
          ) : (
            <ul className="flex max-h-[52vh] flex-col divide-y divide-line/40 overflow-y-auto">
              {owned.map((o) => (
                <li key={o.id} className="flex items-center gap-2 py-2">
                  <span className="min-w-0 flex-1 truncate text-body-md text-ink">
                    {o.card ? resolveCardText(o.card, "ko").name : o.id}
                  </span>
                  <Stepper n={o.n} onChange={(v) => save(o.id, v)} />
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="mt-2 text-label-sm text-ink-soft/70">
          덱 규칙(이름당 3장)과 무관하게 실제 보유 수량을 넣으세요. 덱 시뮬레이터·거래글에서
          활용됩니다.
        </p>
      </div>
    </section>
  );
}

function Stepper({ n, onChange }: { n: number; onChange: (v: number) => void }) {
  if (n === 0) {
    return (
      <button
        type="button"
        onClick={() => onChange(1)}
        className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary text-white"
      >
        <Plus className="h-4 w-4" />
      </button>
    );
  }
  return (
    <span className="flex shrink-0 items-center gap-1.5">
      <button
        type="button"
        onClick={() => onChange(n - 1)}
        className="grid h-7 w-7 place-items-center rounded-full bg-subcanvas text-ink-soft hover:text-ink"
      >
        <Minus className="h-4 w-4" />
      </button>
      <input
        type="number"
        value={n}
        min={0}
        max={999}
        onChange={(e) => onChange(Math.floor(Number(e.target.value) || 0))}
        className={cn(
          "w-11 rounded-lg border border-line bg-card py-1 text-center text-body-md font-bold text-ink",
          "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none",
        )}
      />
      <button
        type="button"
        onClick={() => onChange(n + 1)}
        className="grid h-7 w-7 place-items-center rounded-full bg-primary text-white"
      >
        <Plus className="h-4 w-4" />
      </button>
    </span>
  );
}
