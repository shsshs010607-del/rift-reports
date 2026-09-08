"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { X, SlidersHorizontal, ChevronDown } from "lucide-react";

import { CARD_DOMAINS, CARD_RARITIES, CARD_SETS, CARD_TYPES } from "@/lib/constants";
import type { CardFacets } from "@/lib/services/cardService";
import { cn } from "@/lib/utils";

const LABELS: Record<string, Record<string, string>> = {
  domain: Object.fromEntries(CARD_DOMAINS.map((d) => [d.slug, d.label])),
  type: Object.fromEntries(CARD_TYPES.map((t) => [t.slug, t.label])),
  setCode: Object.fromEntries(CARD_SETS.map((s) => [s.code, s.code])),
  rarity: Object.fromEntries(CARD_RARITIES.map((r) => [r.slug, r.label])),
};
const KEY_LABEL: Record<string, string> = {
  domain: "도메인",
  type: "유형",
  setCode: "확장팩",
  rarity: "레어도",
  cost: "코스트",
};
const COSTS = ["0", "1", "2", "3", "4", "5", "6", "7"];

/**
 * 카드 검색 필터 — 도메인 색스와치 / 코스트 곡선 그래프 / 유형·확장팩·레어도.
 * `facets` 로 각 옵션의 매칭 카드 수·코스트 분포를 시각화해 탐색 생산성을 높인다.
 * 선택 → URL 쿼리스트링 갱신(page 리셋). 서버 컴포넌트가 읽어 필터링.
 */
export function CardFilterBar({ facets }: { facets?: CardFacets | null }) {
  const router = useRouter();
  const params = useSearchParams();
  const advActive = Boolean(params.get("setCode") || params.get("rarity"));
  const [adv, setAdv] = useState(false);
  const [pending, startTransition] = useTransition();

  const push = (next: URLSearchParams) => {
    next.delete("page");
    const qs = next.toString();
    startTransition(() => {
      router.push(qs ? `/cards?${qs}` : "/cards", { scroll: false });
    });
  };

  const toggle = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (next.get(key) === value) next.delete(key);
    else next.set(key, value);
    push(next);
  };

  const clearOne = (key: string) => {
    const next = new URLSearchParams(params.toString());
    next.delete(key);
    push(next);
  };

  const clearAll = () => {
    const next = new URLSearchParams();
    const q = params.get("q");
    if (q) next.set("q", q);
    push(next);
  };

  const active = (key: string, value: string) => params.get(key) === value;
  const activeKeys = ["domain", "cost", "type", "setCode", "rarity"].filter((k) => params.get(k));

  const costCounts = facets?.cost ?? {};
  const costMax = Math.max(1, ...COSTS.map((c) => costCounts[c] ?? 0));

  return (
    <div
      aria-busy={pending}
      className={cn("note-card p-4 pr-6 transition-opacity", pending && "opacity-70")}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-label-lg font-bold text-ink">
          <SlidersHorizontal className="h-4 w-4 text-primary" />
          필터
          {activeKeys.length > 0 && (
            <span className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[11px] font-black text-white">
              {activeKeys.length}
            </span>
          )}
        </span>
        <div className="flex items-center gap-2.5">
          {facets && (
            <span className="text-label-sm font-bold text-ink-soft">
              <span className="text-primary-strong">{facets.total.toLocaleString()}</span>장 일치
            </span>
          )}
          {activeKeys.length > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className="text-label-sm font-bold text-ink-soft transition hover:text-error"
            >
              전체 해제
            </button>
          )}
        </div>
      </div>

      {/* 활성 필터 요약 */}
      {activeKeys.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {activeKeys.map((k) => {
            const v = params.get(k)!;
            const label = k === "cost" ? v : (LABELS[k]?.[v] ?? v);
            return (
              <button
                key={k}
                type="button"
                onClick={() => clearOne(k)}
                className="inline-flex items-center gap-1 rounded-full bg-primary/12 px-2.5 py-1 text-label-sm font-bold text-primary-strong transition hover:bg-primary/20"
              >
                {KEY_LABEL[k] ?? k} · {label}
                <X className="h-3 w-3" />
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-4 flex flex-col gap-4">
          {/* 도메인 — 색 스와치 + 개수 */}
          <section>
            <p className="mb-2 text-label-sm font-bold uppercase tracking-wide text-ink-soft">
              도메인
            </p>
            <div className="flex flex-wrap gap-2">
              {CARD_DOMAINS.map((d) => {
                const on = active("domain", d.slug);
                const n = facets?.domain[d.slug];
                const empty = facets != null && !on && n === 0;
                return (
                  <button
                    key={d.slug}
                    type="button"
                    onClick={() => toggle("domain", d.slug)}
                    aria-pressed={on}
                    disabled={empty}
                    className={cn(
                      "group flex flex-col items-center gap-1 rounded-xl px-2 py-1.5 transition",
                      on ? "bg-primary/10 ring-1 ring-primary/40" : "hover:bg-subcanvas",
                      empty && "cursor-not-allowed opacity-35",
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/domains/${d.slug}.svg`}
                      alt=""
                      width={36}
                      height={36}
                      className={cn(
                        "h-9 w-9 transition",
                        on
                          ? "scale-110"
                          : "opacity-55 grayscale group-hover:opacity-100 group-hover:grayscale-0",
                      )}
                    />
                    <span
                      className={cn(
                        "text-[11px] font-bold",
                        on ? "text-primary-strong" : "text-ink-soft",
                      )}
                    >
                      {d.label}
                      {n != null && <span className="ml-0.5 font-normal text-ink-soft/70">{n}</span>}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* 코스트 — 미니 곡선 그래프 */}
          <section>
            <p className="mb-2 text-label-sm font-bold uppercase tracking-wide text-ink-soft">
              코스트{facets && <span className="ml-1.5 font-normal normal-case">· 곡선</span>}
            </p>
            <div className="flex items-end gap-1.5">
              {COSTS.map((c) => {
                const on = active("cost", c);
                const n = costCounts[c] ?? 0;
                const h = facets ? Math.max(3, Math.round((n / costMax) * 40)) : 0;
                const empty = facets != null && !on && n === 0;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggle("cost", c)}
                    aria-pressed={on}
                    disabled={empty}
                    title={facets ? `코스트 ${c} · ${n}장` : `코스트 ${c}`}
                    className={cn(
                      "flex flex-1 flex-col items-center gap-1 rounded-lg pt-1 transition",
                      empty ? "cursor-not-allowed opacity-35" : "hover:bg-subcanvas/70",
                    )}
                  >
                    {facets && (
                      <span className="flex h-[42px] w-full items-end justify-center">
                        <span
                          style={{ height: `${h}px` }}
                          className={cn(
                            "w-full max-w-[22px] rounded-t-[3px] transition-all",
                            on ? "bg-primary" : "bg-primary/25 group-hover:bg-primary/40",
                          )}
                        />
                      </span>
                    )}
                    <span
                      className={cn(
                        "grid h-8 w-8 place-items-center rounded-lg text-body-md font-black transition",
                        on
                          ? "bg-primary text-white shadow-sm"
                          : "bg-subcanvas text-ink-soft hover:text-ink",
                      )}
                    >
                      {c}
                    </span>
                    {facets && (
                      <span className="text-[10px] tabular-nums text-ink-soft/70">{n}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          <PillGroup
            title="유형"
            items={CARD_TYPES.map((t) => ({ key: t.slug, label: t.label }))}
            isOn={(k) => active("type", k)}
            onPick={(k) => toggle("type", k)}
            counts={facets?.type}
          />

          {/* 상세 필터 — 확장팩 · 레어도 */}
          <div className="border-t border-line/60 pt-3">
            <button
              type="button"
              onClick={() => setAdv((v) => !v)}
              className="flex w-full items-center gap-1.5 text-label-md font-bold text-ink-soft transition hover:text-ink"
            >
              <ChevronDown
                className={cn("h-4 w-4 transition", (adv || advActive) && "rotate-180")}
              />
              상세 필터
              {advActive && (
                <span className="grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-black text-white">
                  ●
                </span>
              )}
            </button>

            {(adv || advActive) && (
              <div className="mt-3 flex flex-col gap-4">
                <PillGroup
                  title="확장팩"
                  items={CARD_SETS.map((s) => ({ key: s.code, label: `${s.code} ${s.label}` }))}
                  isOn={(k) => active("setCode", k)}
                  onPick={(k) => toggle("setCode", k)}
                  counts={facets?.setCode}
                />
                <PillGroup
                  title="레어도"
                  items={CARD_RARITIES.map((r) => ({ key: r.slug, label: r.label }))}
                  isOn={(k) => active("rarity", k)}
                  onPick={(k) => toggle("rarity", k)}
                  counts={facets?.rarity}
                />
              </div>
            )}
          </div>
        </div>
    </div>
  );
}

function PillGroup({
  title,
  items,
  isOn,
  onPick,
  counts,
}: {
  title: string;
  items: { key: string; label: string }[];
  isOn: (key: string) => boolean;
  onPick: (key: string) => void;
  counts?: Record<string, number>;
}) {
  return (
    <section>
      <p className="mb-2 text-label-sm font-bold uppercase tracking-wide text-ink-soft">{title}</p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((it) => {
          const on = isOn(it.key);
          const n = counts?.[it.key];
          const empty = counts != null && !on && n === 0;
          return (
            <button
              key={it.key}
              type="button"
              onClick={() => onPick(it.key)}
              aria-pressed={on}
              disabled={empty}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-body-sm font-semibold transition",
                on
                  ? "bg-primary text-white shadow-sm"
                  : "bg-subcanvas text-ink-soft hover:bg-subcanvas/70 hover:text-ink",
                empty && "cursor-not-allowed opacity-35",
              )}
            >
              {it.label}
              {n != null && (
                <span
                  className={cn(
                    "tabular-nums",
                    on ? "text-white/75" : "text-ink-soft/60",
                  )}
                >
                  {n}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
