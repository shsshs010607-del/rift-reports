"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Minus, Search, Layers, X, SlidersHorizontal, ChevronDown } from "lucide-react";

import type { Card, CardType } from "@/lib/types/card";
import type { Deck, ResolvedDeck } from "@/lib/types/deck";
import { matchesIdentity, matchesLegendChampion, planAdd } from "@/lib/deck/deck-model";
import { CARD_DOMAINS, CARD_RARITIES, CARD_SETS, CARD_TYPES } from "@/lib/constants";
import { LocalizedCard } from "@/components/cards/localized-card";
import { cn } from "@/lib/utils";

type ApiResponse = { count: number; cards: Card[] };

export type PoolTab =
  "all" | "legend" | "champion" | "main" | "battlefield" | "rune" | "side";

const TABS: { key: PoolTab; label: string; apiType?: CardType }[] = [
  { key: "all", label: "전체" },
  { key: "legend", label: "전설", apiType: "legend" },
  { key: "champion", label: "선발 챔피언", apiType: "champion" },
  { key: "main", label: "주 덱" },
  { key: "battlefield", label: "전장", apiType: "battlefield" },
  { key: "rune", label: "룬", apiType: "rune" },
  { key: "side", label: "사이드덱" },
];

const MAIN_TYPES: CardType[] = ["champion", "unit", "spell", "gear"];
const LIMIT = 90;
const COSTS = ["0", "1", "2", "3", "4", "5", "6", "7"]; // "7" = 7 이상
const TYPE_LABEL = Object.fromEntries(CARD_TYPES.map((t) => [t.slug, t.label])) as Record<string, string>;
const RARITY_LABEL = Object.fromEntries(CARD_RARITIES.map((r) => [r.slug, r.label])) as Record<string, string>;
const DOMAIN_LABEL = Object.fromEntries(CARD_DOMAINS.map((d) => [d.slug, d.label])) as Record<string, string>;

type SortKey = "default" | "costAsc" | "costDesc" | "name";
const SORTS: { key: SortKey; label: string }[] = [
  { key: "default", label: "기본" },
  { key: "costAsc", label: "코스트 낮은순" },
  { key: "costDesc", label: "코스트 높은순" },
  { key: "name", label: "이름순" },
];

type Filters = {
  domains: string[];
  costs: string[];
  types: string[];
  rarities: string[];
  powers: string[];
  keywords: string[];
  tags: string[];
};
const EMPTY_FILTERS: Filters = {
  domains: [],
  costs: [],
  types: [],
  rarities: [],
  powers: [],
  keywords: [],
  tags: [],
};
const POWERS = ["1", "2", "3", "4", "5", "6", "7"]; // "7" = 7 이상

const costKey = (c: Card) => (typeof c.cost === "number" ? String(Math.min(c.cost, 7)) : null);
const powerKey = (c: Card) => (typeof c.power === "number" && c.power > 0 ? String(Math.min(c.power, 7)) : null);

// 룰 텍스트의 [키워드] 표기에서 키워드만 뽑는다. 룬 아이콘([분노 룬] 등)과 비용 기호([휴식])는 제외하고 "맹공 2" → "맹공".
const KEYWORD_SKIP = new Set(["휴식"]);
const kwCache = new WeakMap<Card, string[]>();
function keywordsOf(c: Card): string[] {
  const hit = kwCache.get(c);
  if (hit) return hit;
  const set = new Set<string>();
  for (const m of c.text.matchAll(/\[([^\]]{1,12})\]/g)) {
    const k = m[1].replace(/\s*\d+$/, "").trim();
    if (!k || k.endsWith("룬") || KEYWORD_SKIP.has(k)) continue;
    set.add(k);
  }
  const arr = [...set];
  kwCache.set(c, arr);
  return arr;
}

/** skip 그룹만 빼고 나머지 필터를 적용 — 각 칩의 "선택하면 몇 장" 개수를 세기 위한 패싯 계산용. */
function passes(c: Card, f: Filters, skip?: keyof Filters, kwAll = false): boolean {
  if (skip !== "domains" && f.domains.length > 0) {
    // 무색 카드(전장 등)는 색 필터와 무관하게 항상 남긴다 (예전 API colorlessOk 동작과 동일).
    if (c.domains.length > 0 && !c.domains.some((d) => f.domains.includes(d))) return false;
  }
  if (skip !== "costs" && f.costs.length > 0) {
    const k = costKey(c);
    if (k == null || !f.costs.includes(k)) return false;
  }
  if (skip !== "types" && f.types.length > 0 && !f.types.includes(c.type)) return false;
  if (skip !== "rarities" && f.rarities.length > 0 && !f.rarities.includes(c.rarity)) return false;
  if (skip !== "powers" && f.powers.length > 0) {
    const k = powerKey(c);
    if (k == null || !f.powers.includes(k)) return false;
  }
  if (skip !== "keywords" && f.keywords.length > 0) {
    const have = keywordsOf(c);
    const ok = kwAll ? f.keywords.every((k) => have.includes(k)) : have.some((k) => f.keywords.includes(k));
    if (!ok) return false;
  }
  if (skip !== "tags" && f.tags.length > 0 && !c.subtypes.some((t) => f.tags.includes(t))) return false;
  return true;
}

/**
 * 덱 빌더 좌측 — 존 탭 + 검색(/api/cards) + 카드 그리드.
 * 카드를 누르면 planAdd 규칙에 따라 전설/챔피언 슬롯 또는 해당 존으로 들어간다.
 */
export function CardPool({
  tab,
  onTabChange,
  rd,
  deck,
  onPick,
  onRemove,
  onResults,
}: {
  tab: PoolTab;
  onTabChange: (t: PoolTab) => void;
  rd: ResolvedDeck;
  deck: Deck;
  onPick: (card: Card) => void;
  onRemove: (card: Card) => void;
  onResults: (cards: Card[]) => void;
}) {
  const [q, setQ] = useState("");
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [sort, setSort] = useState<SortKey>("default");
  const [showAdv, setShowAdv] = useState(false);
  const [kwAll, setKwAll] = useState(false); // 키워드: false=하나라도 / true=모두 가진 카드
  const [setCode, setSetCode] = useState("");
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [collection, setCollection] = useState<Record<string, number>>({});
  const [ownedOnly, setOwnedOnly] = useState(false);

  useEffect(() => {
    fetch("/api/collection")
      .then((r) => (r.ok ? r.json() : {}))
      .then((m: Record<string, number>) => setCollection(m ?? {}))
      .catch(() => {});
  }, []);
  const hasCollection = Object.keys(collection).length > 0;

  const apiType = TABS.find((t) => t.key === tab)?.apiType;

  const isSide = tab === "side";
  const target = isSide ? "side" : "main";

  // 사이드덱 탭에선 사이드덱 장수를, 그 외엔 주 덱(+전설·챔피언 슬롯) 장수를 보여준다.
  const qtyById = useMemo(() => {
    const m = new Map<string, number>();
    if (isSide) {
      for (const e of deck.side ?? []) m.set(e.id, e.qty);
      return m;
    }
    for (const e of deck.entries) m.set(e.id, e.qty);
    if (rd.legend) m.set(rd.legend.id, (m.get(rd.legend.id) ?? 0) + 1);
    if (rd.champion) m.set(rd.champion.id, (m.get(rd.champion.id) ?? 0) + 1);
    return m;
  }, [isSide, deck.entries, deck.side, rd.legend, rd.champion]);

  const onResultsRef = useRef(onResults);
  onResultsRef.current = onResults;
  const rdRef = useRef(rd);
  rdRef.current = rd;

  useEffect(() => {
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        // 타입 필터가 없는 탭(전체·주 덱)은 전량을 받아 클라에서 색 정체성으로 거른다.
        // (limit 90 이면 수집번호 앞쪽 카드만 와서 색 하나가 통째로 빠지는 버그)
        const sp = new URLSearchParams({ limit: apiType ? String(LIMIT) : "500" });
        // 영역·코스트·유형·희귀도는 다중 선택 + 패싯 개수 때문에 서버가 아니라 클라에서 거른다.
        if (q.trim()) sp.set("q", q.trim());
        if (setCode) sp.set("setCode", setCode);
        if (apiType) sp.set("type", apiType);
        const res = await fetch(`/api/cards?${sp}`, { signal: ctrl.signal });
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as ApiResponse;
        const mainLike = tab === "main" || tab === "side";
        const filtered = mainLike
          ? data.cards.filter(
              (c) => MAIN_TYPES.includes(c.type) && matchesIdentity(rdRef.current, c),
            )
          : data.cards;
        setCards(filtered);
        onResultsRef.current(data.cards);
      } catch (err) {
        if ((err as Error).name !== "AbortError")
          setError("카드를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    }, 280);
    return () => {
      ctrl.abort();
      clearTimeout(t);
    };
    // rd.legend/champion 변경 시 주 덱 색 필터 갱신
  }, [q, setCode, apiType, tab, rd.legend?.id, rd.champion?.id]);

  const idColors = rd.legend?.domains ?? rd.champion?.domains ?? [];
  const idLabels = CARD_DOMAINS.filter((d) => idColors.includes(d.slug));

  // 존 탭 규칙(+보유 필터)까지 적용한 기준 목록 — 사용자 필터·패싯 개수는 이 위에서 계산한다.
  const baseCards = useMemo(
    () =>
      cards.filter((card) => {
        if (ownedOnly && !((collection[card.id] ?? 0) > 0)) return false;
        if (tab === "all") return true;
        // "선발 챔피언" 탭은 전설과 이름이 같은 챔피언만 (지정 슬롯 전용).
        // 다른 챔피언은 "주 덱" 탭에 나온다.
        if (tab === "champion") return matchesLegendChampion(rd, card);
        if (tab === "rune") return matchesIdentity(rd, card); // 색 맞는 룬 (가득 차도 표시)
        if (planAdd(deck, rd, card, target).kind !== "blocked") return true;
        // 못 넣는 카드라도 이미 덱에 있으면(=최대 도달) 남겨서 -버튼을 받는다
        return (qtyById.get(card.id) ?? 0) > 0;
      }),
    [cards, ownedOnly, collection, tab, rd, deck, target, qtyById],
  );

  // 이 탭에서 의미 있는 필터 그룹만 노출 (룬·전장엔 코스트/희귀도 구분이 무의미).
  const showCost = tab === "all" || tab === "main" || tab === "side" || tab === "champion";
  const typeOptions: CardType[] =
    tab === "all" ? (CARD_TYPES.map((t) => t.slug) as CardType[]) : tab === "main" || tab === "side" ? MAIN_TYPES : [];

  const visibleCards = useMemo(() => {
    const list = baseCards.filter((c) => passes(c, filters, undefined, kwAll));
    if (sort === "default") return list;
    const byCost = (a: Card, b: Card) => (a.cost ?? 99) - (b.cost ?? 99);
    const sorted = [...list];
    if (sort === "costAsc") sorted.sort((a, b) => byCost(a, b) || a.name.localeCompare(b.name, "ko"));
    else if (sort === "costDesc") sorted.sort((a, b) => -byCost(a, b) || a.name.localeCompare(b.name, "ko"));
    else sorted.sort((a, b) => a.name.localeCompare(b.name, "ko"));
    return sorted;
  }, [baseCards, filters, sort, kwAll]);

  // 패싯: 다른 필터를 적용한 상태에서 각 칩을 켜면 남는 장수.
  const facets = useMemo(() => {
    const count = (skip: keyof Filters, keyOf: (c: Card) => string | null) => {
      const m: Record<string, number> = {};
      for (const c of baseCards) {
        if (!passes(c, filters, skip, kwAll)) continue;
        const k = keyOf(c);
        if (k != null) m[k] = (m[k] ?? 0) + 1;
      }
      return m;
    };
    const domainCount: Record<string, number> = {};
    for (const c of baseCards) {
      if (!passes(c, filters, "domains", kwAll)) continue;
      for (const d of c.domains) domainCount[d] = (domainCount[d] ?? 0) + 1;
    }
    const countMany = (skip: keyof Filters, keysOf: (c: Card) => string[]) => {
      const m: Record<string, number> = {};
      for (const c of baseCards) {
        if (!passes(c, filters, skip, kwAll)) continue;
        for (const k of keysOf(c)) m[k] = (m[k] ?? 0) + 1;
      }
      return m;
    };
    return {
      domains: domainCount,
      costs: count("costs", costKey),
      types: count("types", (c) => c.type),
      rarities: count("rarities", (c) => c.rarity),
      powers: count("powers", powerKey),
      keywords: countMany("keywords", keywordsOf),
      tags: countMany("tags", (c) => c.subtypes),
    };
  }, [baseCards, filters, kwAll]);

  // 키워드·지역/종족 칩 후보 — 다른 필터와 무관하게 이 탭 카드 전체에서 뽑아 칩이 깜빡이지 않게 한다.
  const keywordOptions = useMemo(() => topOptions(baseCards, keywordsOf, 1), [baseCards]);
  const tagOptions = useMemo(() => topOptions(baseCards, (c) => c.subtypes, 2), [baseCards]);
  const [showAllTags, setShowAllTags] = useState(false);
  const showPower = showCost && baseCards.some((c) => powerKey(c) != null);

  const toggleIn = (key: keyof Filters, v: string) =>
    setFilters((f) => ({ ...f, [key]: f[key].includes(v) ? f[key].filter((x) => x !== v) : [...f[key], v] }));
  const advCount =
    filters.costs.length +
    filters.types.length +
    filters.rarities.length +
    filters.powers.length +
    filters.keywords.length +
    filters.tags.length +
    (setCode ? 1 : 0);
  const activeCount = filters.domains.length + advCount;
  const resetFilters = () => {
    setFilters(EMPTY_FILTERS);
    setSetCode("");
  };

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-line bg-card p-3">
      {/* 존 탭 */}
      <div className="flex flex-wrap gap-1 border-b border-line pb-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => onTabChange(t.key)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-label-md font-bold transition",
              tab === t.key
                ? "bg-primary text-white"
                : "text-ink-soft hover:bg-subcanvas hover:text-ink",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

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

      {/* 영역 — 색 아이콘 + 장수 (다중 선택) */}
      <div className="flex flex-wrap gap-1.5">
        {CARD_DOMAINS.map((d) => {
          const on = filters.domains.includes(d.slug);
          const n = facets.domains[d.slug] ?? 0;
          const empty = !on && n === 0;
          return (
            <button
              key={d.slug}
              type="button"
              onClick={() => toggleIn("domains", d.slug)}
              aria-pressed={on}
              disabled={empty}
              title={`${d.label} ${n}장`}
              className={cn(
                "group flex min-w-[46px] flex-col items-center gap-0.5 rounded-xl px-1.5 py-1 transition",
                on ? "bg-primary/10 ring-1 ring-primary/40" : "hover:bg-subcanvas",
                empty && "cursor-not-allowed opacity-35",
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/domains/${d.slug}.svg`}
                alt=""
                width={28}
                height={28}
                className={cn(
                  "h-7 w-7 transition",
                  on ? "scale-110" : "opacity-60 grayscale group-hover:opacity-100 group-hover:grayscale-0",
                )}
              />
              <span className={cn("text-[10px] font-bold", on ? "text-primary-strong" : "text-ink-soft")}>
                {d.label}
                <span className="ml-0.5 font-normal text-ink-soft/70">{n}</span>
              </span>
            </button>
          );
        })}
        {hasCollection && (
          <PoolChip on={ownedOnly} onClick={() => setOwnedOnly((v) => !v)}>
            <Layers className="h-3 w-3" />
            내 컬렉션만
          </PoolChip>
        )}
      </div>

      {/* 정렬 — 자주 써서 상세 필터 밖에 항상 노출 */}
      <div className="flex flex-wrap items-center gap-1">
        <span className="mr-0.5 text-label-sm font-bold text-ink-soft">정렬</span>
        {SORTS.map((s) => (
          <PoolChip key={s.key} on={sort === s.key} onClick={() => setSort(s.key)}>
            {s.label}
          </PoolChip>
        ))}
      </div>

      {/* 상세 필터 — 코스트 곡선 · 유형 · 희귀도 · 확장팩 */}
      <div className="rounded-xl bg-subcanvas/50 px-2.5 py-2">
        <button
          type="button"
          onClick={() => setShowAdv((v) => !v)}
          className="flex w-full items-center gap-1.5 text-label-md font-bold text-ink-soft transition hover:text-ink"
        >
          <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
          상세 필터
          {advCount > 0 && (
            <span className="grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-black text-white">
              {advCount}
            </span>
          )}
          <ChevronDown className={cn("ml-auto h-4 w-4 transition", showAdv && "rotate-180")} />
        </button>

        {showAdv && (
          <div className="mt-3 flex flex-col gap-3">
            {showCost && (
              <PoolSection title="코스트">
                <div className="flex items-end gap-1">
                  {(() => {
                    const max = Math.max(1, ...COSTS.map((c) => facets.costs[c] ?? 0));
                    return COSTS.map((c) => {
                      const on = filters.costs.includes(c);
                      const n = facets.costs[c] ?? 0;
                      const empty = !on && n === 0;
                      const h = Math.max(3, Math.round((n / max) * 28));
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => toggleIn("costs", c)}
                          aria-pressed={on}
                          disabled={empty}
                          title={`코스트 ${c === "7" ? "7+" : c} · ${n}장`}
                          className={cn(
                            "flex flex-1 flex-col items-center gap-0.5 rounded-lg pt-0.5 transition",
                            empty ? "cursor-not-allowed opacity-35" : "hover:bg-subcanvas",
                          )}
                        >
                          <span className="flex h-[30px] w-full items-end justify-center">
                            <span
                              style={{ height: `${h}px` }}
                              className={cn(
                                "w-full max-w-[16px] rounded-t-[3px] transition-all",
                                on ? "bg-primary" : "bg-primary/25",
                              )}
                            />
                          </span>
                          <span
                            className={cn(
                              "grid h-6 w-6 place-items-center rounded-md text-label-md font-black transition",
                              on ? "bg-primary text-white shadow-sm" : "bg-card text-ink-soft",
                            )}
                          >
                            {c === "7" ? "7+" : c}
                          </span>
                          <span className="text-[10px] tabular-nums text-ink-soft/70">{n}</span>
                        </button>
                      );
                    });
                  })()}
                </div>
              </PoolSection>
            )}

            {typeOptions.length > 1 && (
              <PoolSection title="유형">
                <div className="flex flex-wrap gap-1">
                  {typeOptions.map((t) => {
                    const on = filters.types.includes(t);
                    const n = facets.types[t] ?? 0;
                    return (
                      <PoolChip key={t} on={on} disabled={!on && n === 0} onClick={() => toggleIn("types", t)}>
                        {TYPE_LABEL[t] ?? t}
                        <span className="tabular-nums text-ink-soft/60">{n}</span>
                      </PoolChip>
                    );
                  })}
                </div>
              </PoolSection>
            )}

            {showPower && (
              <PoolSection title="위력">
                <div className="flex flex-wrap gap-1">
                  {POWERS.map((p) => {
                    const on = filters.powers.includes(p);
                    const n = facets.powers[p] ?? 0;
                    return (
                      <PoolChip key={p} on={on} disabled={!on && n === 0} onClick={() => toggleIn("powers", p)}>
                        {p === "7" ? "7+" : p}
                        <span className="tabular-nums text-ink-soft/60">{n}</span>
                      </PoolChip>
                    );
                  })}
                </div>
              </PoolSection>
            )}

            {keywordOptions.length > 0 && (
              <PoolSection title="키워드">
                <div className="mb-1 flex gap-1">
                  <PoolChip on={!kwAll} onClick={() => setKwAll(false)}>하나라도</PoolChip>
                  <PoolChip on={kwAll} onClick={() => setKwAll(true)}>모두 포함</PoolChip>
                </div>
                <div className="flex flex-wrap gap-1">
                  {keywordOptions.map((k) => {
                    const on = filters.keywords.includes(k);
                    const n = facets.keywords[k] ?? 0;
                    return (
                      <PoolChip key={k} on={on} disabled={!on && n === 0} onClick={() => toggleIn("keywords", k)}>
                        {k}
                        <span className="tabular-nums text-ink-soft/60">{n}</span>
                      </PoolChip>
                    );
                  })}
                </div>
              </PoolSection>
            )}

            {tagOptions.length > 0 && (
              <PoolSection title="지역 · 종족">
                <div className="flex flex-wrap gap-1">
                  {(showAllTags ? tagOptions : tagOptions.slice(0, 10)).map((t) => {
                    const on = filters.tags.includes(t);
                    const n = facets.tags[t] ?? 0;
                    return (
                      <PoolChip key={t} on={on} disabled={!on && n === 0} onClick={() => toggleIn("tags", t)}>
                        {t}
                        <span className="tabular-nums text-ink-soft/60">{n}</span>
                      </PoolChip>
                    );
                  })}
                  {tagOptions.length > 10 && (
                    <button
                      type="button"
                      onClick={() => setShowAllTags((v) => !v)}
                      className="px-1.5 text-label-sm font-bold text-primary-strong"
                    >
                      {showAllTags ? "접기" : `+${tagOptions.length - 10}개 더보기`}
                    </button>
                  )}
                </div>
              </PoolSection>
            )}

            <PoolSection title="희귀도">
              <div className="flex flex-wrap gap-1">
                {CARD_RARITIES.map((r) => {
                  const on = filters.rarities.includes(r.slug);
                  const n = facets.rarities[r.slug] ?? 0;
                  return (
                    <PoolChip key={r.slug} on={on} disabled={!on && n === 0} onClick={() => toggleIn("rarities", r.slug)}>
                      {r.label}
                      <span className="tabular-nums text-ink-soft/60">{n}</span>
                    </PoolChip>
                  );
                })}
              </div>
            </PoolSection>

            <PoolSection title="확장팩">
              <div className="flex flex-wrap gap-1">
                {CARD_SETS.map((s) => (
                  <PoolChip
                    key={s.code}
                    on={setCode === s.code}
                    onClick={() => setSetCode(setCode === s.code ? "" : s.code)}
                    title={s.name}
                  >
                    <span className="font-mono text-[11px] font-bold">{s.code}</span>
                    {s.label}
                  </PoolChip>
                ))}
              </div>
            </PoolSection>
          </div>
        )}
      </div>

      {/* 활성 필터 요약 */}
      {activeCount > 0 && (
        <div className="flex flex-wrap items-center gap-1">
          {filters.domains.map((d) => (
            <ActiveTag key={`d-${d}`} label={`영역 · ${DOMAIN_LABEL[d] ?? d}`} onClear={() => toggleIn("domains", d)} />
          ))}
          {filters.costs.map((c) => (
            <ActiveTag key={`c-${c}`} label={`코스트 · ${c === "7" ? "7+" : c}`} onClear={() => toggleIn("costs", c)} />
          ))}
          {filters.types.map((t) => (
            <ActiveTag key={`t-${t}`} label={`유형 · ${TYPE_LABEL[t] ?? t}`} onClear={() => toggleIn("types", t)} />
          ))}
          {filters.rarities.map((r) => (
            <ActiveTag key={`r-${r}`} label={`희귀도 · ${RARITY_LABEL[r] ?? r}`} onClear={() => toggleIn("rarities", r)} />
          ))}
          {filters.powers.map((p) => (
            <ActiveTag key={`p-${p}`} label={`위력 · ${p === "7" ? "7+" : p}`} onClear={() => toggleIn("powers", p)} />
          ))}
          {filters.keywords.map((k) => (
            <ActiveTag key={`k-${k}`} label={`키워드 · ${k}`} onClear={() => toggleIn("keywords", k)} />
          ))}
          {filters.tags.map((t) => (
            <ActiveTag key={`g-${t}`} label={`태그 · ${t}`} onClear={() => toggleIn("tags", t)} />
          ))}
          {setCode && <ActiveTag label={`확장팩 · ${setCode}`} onClear={() => setSetCode("")} />}
          <button
            type="button"
            onClick={resetFilters}
            className="ml-1 text-label-sm font-bold text-ink-soft transition hover:text-error"
          >
            전체 해제
          </button>
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <p className="text-label-sm text-ink-soft">
          {loading
            ? "검색 중…"
            : error
              ? error
              : `${visibleCards.length.toLocaleString("ko-KR")}장 일치`}
        </p>
        {idLabels.length > 0 && (
          <p className="flex items-center gap-1 text-label-sm text-ink-soft">
            덱 색:
            {idLabels.map((d) => (
              <span
                key={d.slug}
                className="inline-flex items-center gap-1 font-semibold text-ink"
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: d.color }}
                />
                {d.label}
              </span>
            ))}
          </p>
        )}
      </div>

      {/* 결과 — 모든 카드가 동일한 -/+ 조작 (전설·선발 챔피언은 1장 제한). */}
      <ul className="grid max-h-[62vh] grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3">
        {visibleCards.length === 0 && !loading && !error && (
          <li className="col-span-full py-8 text-center text-body-sm text-ink-soft">
            조건에 맞는 카드가 없어요.
            {activeCount > 0 && (
              <button type="button" onClick={resetFilters} className="ml-1 font-bold text-primary-strong underline">
                필터 해제
              </button>
            )}
          </li>
        )}
        {visibleCards
          .map((card) => {
            const inDeck = qtyById.get(card.id) ?? 0;
            const owned = collection[card.id] ?? 0;
            const plan = planAdd(deck, rd, card, target);
            const blocked = plan.kind === "blocked";
            // 전설·챔피언 슬롯은 1장뿐 — 이미 선택돼 있으면 +는 막는다(자기 자신 중복 방지).
            const isSlot = plan.kind === "legend" || plan.kind === "champion";
            const plusDisabled = blocked || (isSlot && inDeck > 0);
            const plusTitle = blocked
              ? plan.reason
              : plan.kind === "legend"
                ? "전설로 선택"
                : plan.kind === "champion"
                  ? "선발 챔피언으로 선택"
                  : plan.kind === "side"
                    ? "사이드덱에 한 장 추가"
                    : "한 장 추가";
            return (
              <li key={card.id}>
                <div
                  className={cn(
                    "group relative overflow-hidden rounded-xl border border-line bg-subcanvas transition",
                    blocked && inDeck === 0 && "opacity-45",
                    inDeck > 0 && "border-primary/50",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => onPick(card)}
                    disabled={plusDisabled}
                    title={plusTitle}
                    className="block w-full disabled:cursor-not-allowed"
                  >
                    <div className="relative">
                      <LocalizedCard
                        card={card}
                        sizes="150px"
                        className={cn(
                          "!rounded-none transition",
                          !plusDisabled && "group-hover:brightness-90",
                        )}
                      />
                      {typeof card.cost === "number" && (
                        <span className="absolute left-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-black/70 text-label-sm font-bold text-white">
                          {card.cost}
                        </span>
                      )}
                      {inDeck > 0 && (
                        <span className="absolute right-1 top-1 rounded-full bg-primary px-1.5 text-label-sm font-bold text-white">
                          ×{inDeck}
                        </span>
                      )}
                      {owned > 0 && (
                        <span className="absolute left-1 bottom-1 rounded bg-emerald/90 px-1 text-[10px] font-bold text-white">
                          보유 {owned}
                        </span>
                      )}
                    </div>
                    <p className="truncate px-1.5 py-1 text-label-sm text-ink">{card.name}</p>
                  </button>
                  {inDeck > 0 && (
                    <button
                      type="button"
                      onClick={() => onRemove(card)}
                      title="한 장 빼기"
                      className="absolute right-1 bottom-8 grid h-6 w-6 place-items-center rounded-full bg-black/70 text-white shadow-xs transition hover:bg-error"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </li>
            );
          })}
      </ul>
    </div>
  );
}

/** 카드들에서 값(키워드·태그)을 모아 빈도순으로. minCount 미만은 잡음이라 뺀다. */
function topOptions(cards: Card[], valuesOf: (c: Card) => string[], minCount: number): string[] {
  const m = new Map<string, number>();
  for (const c of cards) for (const v of valuesOf(c)) m.set(v, (m.get(v) ?? 0) + 1);
  return [...m.entries()]
    .filter(([, n]) => n >= minCount)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ko"))
    .map(([v]) => v);
}

function PoolSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <p className="mb-1.5 text-label-sm font-bold uppercase tracking-wide text-ink-soft">{title}</p>
      {children}
    </section>
  );
}

function ActiveTag({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <button
      type="button"
      onClick={onClear}
      className="inline-flex items-center gap-1 rounded-full bg-primary/12 px-2 py-1 text-label-sm font-bold text-primary-strong transition hover:bg-primary/20"
    >
      {label}
      <X className="h-3 w-3" />
    </button>
  );
}

function PoolChip({
  on,
  onClick,
  title,
  disabled,
  children,
}: {
  on: boolean;
  onClick: () => void;
  title?: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      aria-pressed={on}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1.5 text-label-sm transition",
        on
          ? "border-primary bg-primary/10 font-bold text-primary-strong"
          : "border-line text-ink-soft hover:border-primary/40",
        disabled && "cursor-not-allowed opacity-35",
      )}
    >
      {children}
    </button>
  );
}
