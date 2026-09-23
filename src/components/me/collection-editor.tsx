"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Search, Plus, Minus, X, Layers, ChevronDown, CheckSquare, Square, Trash2 } from "lucide-react";

import type { Card } from "@/lib/types/card";
import { resolveCardText, cardNumber } from "@/lib/types/card";
import { CARD_RARITIES } from "@/lib/constants";
import { rarityStyle } from "@/lib/card-style";
import { setCollectionQty } from "@/app/me/collection-actions";
import { LocalizedCard } from "@/components/cards/localized-card";
import { fmtWon } from "@/lib/money";
import { cn } from "@/lib/utils";

const RARITY_LABEL = new Map<string, string>(CARD_RARITIES.map((r) => [r.slug, r.label]));

type Initial = { card_id: string; quantity: number }[];

export function CollectionEditor({
  initial,
  priceByNumber,
}: {
  initial: Initial;
  /** "OGN-039" 형식 카드 번호 → 원화 시세. 시세 없는 카드는 키가 없다. */
  priceByNumber: Record<string, number>;
}) {
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

  const priceFor = (card?: Card): number | null => {
    if (!card) return null;
    const num = cardNumber(card);
    return num && num in priceByNumber ? priceByNumber[num] : null;
  };

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
  const pricedCount = owned.filter((o) => priceFor(o.card) != null).length;
  const totalValue = owned.reduce((s, o) => {
    const p = priceFor(o.card);
    return p != null ? s + p * o.n : s;
  }, 0);

  // 필터 — 보유 카드 안에 실제로 존재하는 값만 칩으로 노출.
  const [rarityFilter, setRarityFilter] = useState<Set<string>>(new Set());
  const [costFilter, setCostFilter] = useState<Set<number>>(new Set());
  const [setFilter, setSetFilter] = useState<Set<string>>(new Set());

  const rarityOptions = useMemo(() => {
    const seen = new Set(owned.map((o) => o.card?.rarity).filter((v): v is string => Boolean(v)));
    return [...seen].sort(
      (a, b) =>
        CARD_RARITIES.findIndex((r) => r.slug === a) - CARD_RARITIES.findIndex((r) => r.slug === b),
    );
  }, [owned]);
  const costOptions = useMemo(() => {
    const seen = new Set(
      owned.map((o) => o.card?.cost).filter((v): v is number => typeof v === "number"),
    );
    return [...seen].sort((a, b) => a - b);
  }, [owned]);
  const setOptions = useMemo(() => {
    const seen = new Set(owned.map((o) => o.card?.setCode).filter((v): v is string => Boolean(v)));
    return [...seen].sort((a, b) => a.localeCompare(b, "ko"));
  }, [owned]);

  function toggleInSet<T>(set: Set<T>, setter: (next: Set<T>) => void, value: T) {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    setter(next);
  }

  const filtered = useMemo(
    () =>
      owned.filter((o) => {
        if (rarityFilter.size && !(o.card && rarityFilter.has(o.card.rarity))) return false;
        if (costFilter.size && !(o.card && o.card.cost != null && costFilter.has(o.card.cost)))
          return false;
        if (setFilter.size && !(o.card && setFilter.has(o.card.setCode))) return false;
        return true;
      }),
    [owned, rarityFilter, costFilter, setFilter],
  );
  const filterActive = rarityFilter.size > 0 || costFilter.size > 0 || setFilter.size > 0;

  // 세트별로 묶어서 — 컬렉션이 커질수록 "이 세트에서 뭐 있더라" 찾기가 훨씬 편해진다.
  const ownedBySet = useMemo(() => {
    const groups = new Map<string, typeof owned>();
    for (const o of filtered) {
      const key = o.card?.setCode ?? "기타";
      const arr = groups.get(key);
      if (arr) arr.push(o);
      else groups.set(key, [o]);
    }
    return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b, "ko"));
  }, [filtered]);

  // 선택 — 전체/일부 선택 후 일괄 삭제하거나 선택분 시세 합계를 본다.
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const allFilteredSelected = filtered.length > 0 && filtered.every((o) => selected.has(o.id));

  function toggleSelectAll() {
    if (allFilteredSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((o) => o.id)));
    }
  }
  function toggleSelect(id: string) {
    toggleInSet(selected, setSelected, id);
  }
  const selectedRows = owned.filter((o) => selected.has(o.id));
  const selectedTotal = selectedRows.reduce((s, o) => {
    const p = priceFor(o.card);
    return p != null ? s + p * o.n : s;
  }, 0);
  function deleteSelected() {
    if (selectedRows.length === 0) return;
    if (!confirm(`선택한 ${selectedRows.length}종을 컬렉션에서 삭제할까요?`)) return;
    for (const o of selectedRows) save(o.id, 0);
    setSelected(new Set());
  }

  const searchRef = useRef<HTMLInputElement>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  function toggleCollapsed(setCode: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(setCode)) next.delete(setCode);
      else next.add(setCode);
      return next;
    });
  }

  /** 검색창에서 엔터 — 첫 검색 결과를 +1 하고 바로 다음 카드를 검색할 수 있게 입력창을 비운다. */
  function addTopResult() {
    if (results.length === 0) return;
    const top = results[0];
    save(top.id, (qty[top.id] ?? 0) + 1);
    setQ("");
    requestAnimationFrame(() => searchRef.current?.focus());
  }

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
    <section id="collection" className="mt-8 scroll-mt-24">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-1.5 text-title-md font-bold text-ink">
          <Layers className="h-4 w-4 text-primary" />
          내 컬렉션
          <span className="text-body-sm font-normal text-ink-soft">
            {distinct}종 · {totalCards}장
          </span>
          {pending && <span className="text-label-sm font-normal text-ink-soft">저장 중…</span>}
        </h2>
        {totalCards > 0 && (
          <p className="text-body-sm text-ink-soft">
            추정 시세 합계{" "}
            <span className="font-display text-title-md font-black text-primary-strong">
              {fmtWon(totalValue)}
            </span>
            {pricedCount < distinct && (
              <span className="ml-1 text-label-sm text-ink-soft/70">
                (시세 확인된 {pricedCount}/{distinct}종 기준)
              </span>
            )}
          </p>
        )}
      </div>

      <div className="note-card p-4 pr-6">
        {/* 검색 */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
          <input
            ref={searchRef}
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTopResult();
              }
            }}
            placeholder="카드명·번호 검색 후 엔터로 바로 담기"
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
              results.map((c) => {
                const price = priceFor(c);
                return (
                  <li key={c.id} className="flex items-center gap-2.5 py-2">
                    <LocalizedCard card={c} className="w-10 shrink-0" sizes="40px" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-body-md text-ink">
                        {resolveCardText(c, "ko").name}
                      </span>
                      <span className="block text-label-sm text-ink-soft">
                        {cardNumber(c) ?? c.setCode}
                        {price != null && <span className="ml-1.5 font-bold text-primary-strong">{fmtWon(price)}</span>}
                      </span>
                    </span>
                    <Stepper n={qty[c.id] ?? 0} onChange={(v) => save(c.id, v)} />
                  </li>
                );
              })
            )}
          </ul>
        )}

        {/* 보유 목록 */}
        <div className="mt-4 border-t border-line/60 pt-3">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-label-sm font-bold text-ink-soft">
              보유 카드
              {filterActive && (
                <span className="ml-1 font-normal text-ink-soft/70">
                  ({filtered.length}/{distinct}종 표시 중)
                </span>
              )}
            </p>
            {filtered.length > 0 && (
              <button
                type="button"
                onClick={toggleSelectAll}
                className="inline-flex items-center gap-1.5 text-label-sm font-bold text-ink-soft hover:text-primary-strong"
              >
                {allFilteredSelected ? (
                  <CheckSquare className="h-4 w-4" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
                전체 선택
              </button>
            )}
          </div>

          {owned.length > 0 && (
            <div className="mb-3 flex flex-col gap-2">
              {rarityOptions.length > 1 && (
                <FilterRow label="희귀도">
                  {rarityOptions.map((slug) => {
                    const style = rarityStyle(slug);
                    return (
                      <FilterChip
                        key={slug}
                        active={rarityFilter.has(slug)}
                        onClick={() => toggleInSet(rarityFilter, setRarityFilter, slug)}
                      >
                        {RARITY_LABEL.get(slug) ?? style.label}
                      </FilterChip>
                    );
                  })}
                </FilterRow>
              )}
              {costOptions.length > 1 && (
                <FilterRow label="코스트">
                  {costOptions.map((c) => (
                    <FilterChip
                      key={c}
                      active={costFilter.has(c)}
                      onClick={() => toggleInSet(costFilter, setCostFilter, c)}
                    >
                      {c}
                    </FilterChip>
                  ))}
                </FilterRow>
              )}
              {setOptions.length > 1 && (
                <FilterRow label="세트">
                  {setOptions.map((s) => (
                    <FilterChip
                      key={s}
                      active={setFilter.has(s)}
                      onClick={() => toggleInSet(setFilter, setSetFilter, s)}
                    >
                      {s}
                    </FilterChip>
                  ))}
                </FilterRow>
              )}
            </div>
          )}

          {selected.size > 0 && (
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-primary/30 bg-primary/5 px-3 py-2">
              <span className="text-body-sm text-ink">
                {selected.size}종 선택됨
                {selectedTotal > 0 && (
                  <span className="ml-1.5 font-bold text-primary-strong">
                    · 시세 합계 {fmtWon(selectedTotal)}
                  </span>
                )}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelected(new Set())}
                  className="text-label-sm font-bold text-ink-soft hover:text-ink"
                >
                  선택 해제
                </button>
                <button
                  type="button"
                  onClick={deleteSelected}
                  className="inline-flex items-center gap-1 rounded-lg border border-error/40 px-2.5 py-1 text-label-sm font-bold text-error transition hover:bg-error/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  선택 삭제
                </button>
              </div>
            </div>
          )}

          {owned.length === 0 ? (
            <p className="py-4 text-center text-body-sm text-ink-soft">
              아직 담은 카드가 없습니다. 위에서 검색해 수량을 넣어보세요.
            </p>
          ) : filtered.length === 0 ? (
            <p className="py-4 text-center text-body-sm text-ink-soft">
              필터 조건에 맞는 카드가 없습니다.
            </p>
          ) : (
            <div className="max-h-[65vh] overflow-y-auto pr-1">
              {ownedBySet.map(([setCode, cards]) => {
                const isCollapsed = collapsed.has(setCode);
                const active = cards.find((c) => c.id === activeId);
                return (
                  <div key={setCode} className="mb-3">
                    <button
                      type="button"
                      onClick={() => toggleCollapsed(setCode)}
                      className="sticky top-0 z-10 flex w-full items-center gap-1.5 bg-card py-1.5 text-left text-label-sm font-bold text-ink-soft/80 hover:text-ink"
                    >
                      <ChevronDown
                        className={cn(
                          "h-3.5 w-3.5 shrink-0 transition-transform",
                          isCollapsed && "-rotate-90",
                        )}
                      />
                      {setCode} · {cards.length}종 · {cards.reduce((s, c) => s + c.n, 0)}장
                    </button>

                    {!isCollapsed && (
                      <>
                        {/* 카드 이미지 그리드 — 한눈에 훑어보기용. 클릭하면 아래 상세에서 수량 조절. */}
                        <div className="grid grid-cols-5 gap-2 sm:grid-cols-6 md:grid-cols-8">
                          {cards.map((o) => (
                            <div key={o.id} className="relative">
                              <button
                                type="button"
                                onClick={() => setActiveId((v) => (v === o.id ? null : o.id))}
                                title={o.card ? resolveCardText(o.card, "ko").name : o.id}
                                className={cn(
                                  "relative block w-full rounded-[4.5%] transition",
                                  activeId === o.id &&
                                    "ring-2 ring-primary ring-offset-1 ring-offset-card",
                                )}
                              >
                                {o.card ? (
                                  <LocalizedCard
                                    card={o.card}
                                    sizes="(max-width:640px) 18vw, 100px"
                                  />
                                ) : (
                                  <span className="block aspect-[744/1039] rounded-[4.5%] bg-subcanvas" />
                                )}
                                <span className="absolute right-1 top-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-black leading-none text-white shadow">
                                  ×{o.n}
                                </span>
                              </button>
                              <button
                                type="button"
                                onClick={() => toggleSelect(o.id)}
                                aria-label={selected.has(o.id) ? "선택 해제" : "선택"}
                                className={cn(
                                  "absolute left-1 top-1 grid h-5 w-5 place-items-center rounded shadow",
                                  selected.has(o.id)
                                    ? "bg-primary text-white"
                                    : "bg-scrim/50 text-white/80 hover:bg-scrim/70",
                                )}
                              >
                                {selected.has(o.id) ? (
                                  <CheckSquare className="h-3.5 w-3.5" />
                                ) : (
                                  <Square className="h-3.5 w-3.5" />
                                )}
                              </button>
                            </div>
                          ))}
                        </div>

                        {active && (
                          <div className="mt-2 flex items-center gap-2.5 rounded-xl border border-line/70 bg-subcanvas/50 p-2.5">
                            {active.card ? (
                              <LocalizedCard
                                card={active.card}
                                className="w-10 shrink-0"
                                sizes="40px"
                              />
                            ) : (
                              <span className="aspect-[744/1039] w-10 shrink-0 rounded-[4.5%] bg-subcanvas" />
                            )}
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-body-md font-bold text-ink">
                                {active.card ? resolveCardText(active.card, "ko").name : active.id}
                              </span>
                              {(() => {
                                const price = active.card ? priceFor(active.card) : null;
                                if (price == null) return null;
                                return (
                                  <span className="block text-label-sm font-bold text-primary-strong">
                                    {fmtWon(price)}
                                    {active.n > 1 && (
                                      <span className="ml-1 font-normal text-ink-soft">
                                        · {active.n}장 = {fmtWon(price * active.n)}
                                      </span>
                                    )}
                                  </span>
                                );
                              })()}
                            </span>
                            <Stepper n={active.n} onChange={(v) => save(active.id, v)} />
                            <button
                              type="button"
                              onClick={() => setActiveId(null)}
                              className="text-ink-soft hover:text-ink"
                              aria-label="닫기"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
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

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="mr-0.5 text-label-sm text-ink-soft/70">{label}</span>
      {children}
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
        "rounded-full border px-2.5 py-1 text-label-sm font-semibold transition",
        active
          ? "border-primary bg-primary/10 text-primary-strong"
          : "border-line text-ink-soft hover:border-primary/40",
      )}
    >
      {children}
    </button>
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
