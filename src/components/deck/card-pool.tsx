"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Search, Layers } from "lucide-react";

import type { Card, CardType } from "@/lib/types/card";
import type { Deck, ResolvedDeck } from "@/lib/types/deck";
import { matchesIdentity, planAdd } from "@/lib/deck/deck-model";
import { CARD_DOMAINS, CARD_SETS } from "@/lib/constants";
import { LocalizedCard } from "@/components/cards/localized-card";
import { cn } from "@/lib/utils";

type ApiResponse = { count: number; cards: Card[] };

export type PoolTab =
  "all" | "legend" | "champion" | "main" | "battlefield" | "rune";

const TABS: { key: PoolTab; label: string; apiType?: CardType }[] = [
  { key: "all", label: "전체" },
  { key: "legend", label: "레전드", apiType: "legend" },
  { key: "champion", label: "리더 챔피언", apiType: "champion" },
  { key: "main", label: "메인덱" },
  { key: "battlefield", label: "전장", apiType: "battlefield" },
  { key: "rune", label: "룬", apiType: "rune" },
];

const MAIN_TYPES: CardType[] = ["champion", "unit", "spell", "gear"];
const LIMIT = 90;

/**
 * 덱 빌더 좌측 — 존 탭 + 검색(/api/cards) + 카드 그리드.
 * 카드를 누르면 planAdd 규칙에 따라 레전드/챔피언 슬롯 또는 해당 존으로 들어간다.
 */
export function CardPool({
  tab,
  onTabChange,
  rd,
  deck,
  onPick,
  onResults,
}: {
  tab: PoolTab;
  onTabChange: (t: PoolTab) => void;
  rd: ResolvedDeck;
  deck: Deck;
  onPick: (card: Card) => void;
  onResults: (cards: Card[]) => void;
}) {
  const [q, setQ] = useState("");
  const [domain, setDomain] = useState("");
  const [setCode, setSetCode] = useState("");
  const [cards, setCards] = useState<Card[]>([]);
  const [count, setCount] = useState(0);
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

  const qtyById = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of deck.entries) m.set(e.id, e.qty);
    if (rd.legend) m.set(rd.legend.id, (m.get(rd.legend.id) ?? 0) + 1);
    if (rd.champion) m.set(rd.champion.id, (m.get(rd.champion.id) ?? 0) + 1);
    return m;
  }, [deck.entries, rd.legend, rd.champion]);

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
        if (setCode) sp.set("setCode", setCode);
        if (apiType) sp.set("type", apiType);
        const res = await fetch(`/api/cards?${sp}`, { signal: ctrl.signal });
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as ApiResponse;
        const filtered =
          tab === "main"
            ? data.cards.filter((c) => MAIN_TYPES.includes(c.type))
            : data.cards;
        setCards(filtered);
        setCount(tab === "main" ? filtered.length : data.count);
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
  }, [q, domain, setCode, apiType, tab]);

  const idColors = rd.legend?.domains ?? rd.champion?.domains ?? [];
  const idLabels = CARD_DOMAINS.filter((d) => idColors.includes(d.slug));

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

      {/* 도메인 · 확장팩 */}
      <div className="flex flex-wrap gap-1">
        {CARD_DOMAINS.map((d) => (
          <PoolChip
            key={d.slug}
            on={domain === d.slug}
            onClick={() => setDomain(domain === d.slug ? "" : d.slug)}
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: d.color }}
            />
            {d.label}
          </PoolChip>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-1">
        {CARD_SETS.map((s) => (
          <PoolChip
            key={s.code}
            on={setCode === s.code}
            onClick={() => setSetCode(setCode === s.code ? "" : s.code)}
            title={s.name}
          >
            <span className="font-mono text-[11px] font-bold">{s.code}</span>
          </PoolChip>
        ))}
        {hasCollection && (
          <PoolChip on={ownedOnly} onClick={() => setOwnedOnly((v) => !v)}>
            <Layers className="h-3 w-3" />
            내 컬렉션만
          </PoolChip>
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        <p className="text-label-sm text-ink-soft">
          {loading
            ? "검색 중…"
            : error
              ? error
              : `${count.toLocaleString("ko-KR")}장`}
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

      {/* 결과 — "전체"를 제외한 탭에서는 넣을 수 있는 카드만 보여준다 */}
      <ul className="grid max-h-[62vh] grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3">
        {cards
          .filter((card) => {
            if (ownedOnly && !((collection[card.id] ?? 0) > 0)) return false;
            if (tab === "all") return true;
            if (tab === "rune") return matchesIdentity(rd, card); // 색 맞는 룬 (가득 차도 표시)
            return planAdd(deck, rd, card).kind !== "blocked";
          })
          .map((card) => {
            const inDeck = qtyById.get(card.id) ?? 0;
            const owned = collection[card.id] ?? 0;
            const plan = planAdd(deck, rd, card);
            const blocked = plan.kind === "blocked";
            return (
              <li key={card.id}>
                <button
                  type="button"
                  onClick={() => !blocked && onPick(card)}
                  disabled={blocked}
                  title={blocked ? plan.reason : "덱에 추가"}
                  className={cn(
                    "group relative block w-full overflow-hidden rounded-xl border border-line bg-subcanvas text-left transition",
                    blocked
                      ? "cursor-not-allowed opacity-45"
                      : "hover:border-primary/50",
                  )}
                >
                  <div className="relative">
                    <LocalizedCard
                      card={card}
                      sizes="150px"
                      className="!rounded-none"
                    />
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
                    {owned > 0 && (
                      <span className="absolute left-1 bottom-1 rounded bg-emerald/90 px-1 text-[10px] font-bold text-white">
                        보유 {owned}
                      </span>
                    )}
                    {!blocked && (
                      <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-primary/90 py-1 text-label-sm font-bold text-white opacity-0 transition group-hover:opacity-100">
                        <Plus className="h-3 w-3" />
                        {plan.kind === "legend"
                          ? "레전드"
                          : plan.kind === "champion"
                            ? "리더 챔피언"
                            : "추가"}
                      </span>
                    )}
                  </div>
                  <p className="truncate px-1.5 py-1 text-label-sm text-ink">
                    {card.name}
                  </p>
                </button>
              </li>
            );
          })}
      </ul>
    </div>
  );
}

function PoolChip({
  on,
  onClick,
  title,
  children,
}: {
  on: boolean;
  onClick: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-label-sm transition",
        on
          ? "border-primary bg-primary/10 font-bold text-primary-strong"
          : "border-line text-ink-soft hover:border-primary/40",
      )}
    >
      {children}
    </button>
  );
}
