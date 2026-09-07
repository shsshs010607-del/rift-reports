"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { X, SlidersHorizontal, ChevronDown } from "lucide-react";

import { CARD_DOMAINS, CARD_RARITIES, CARD_SETS, CARD_TYPES } from "@/lib/constants";
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
 * 카드 검색 필터 — 도메인 색스와치 / 코스트 / 유형·확장팩·레어도.
 * 선택 → URL 쿼리스트링 갱신(page 리셋). 서버 컴포넌트가 읽어 필터링.
 */
export function CardFilterBar() {
  const router = useRouter();
  const params = useSearchParams();
  const [open, setOpen] = useState(true);

  const push = (next: URLSearchParams) => {
    next.delete("page");
    const qs = next.toString();
    router.push(qs ? `/cards?${qs}` : "/cards", { scroll: false });
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

  return (
    <div className="note-card p-4 pr-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 text-label-lg font-bold text-ink"
        >
          <SlidersHorizontal className="h-4 w-4 text-primary" />
          필터
          {activeKeys.length > 0 && (
            <span className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[11px] font-black text-white">
              {activeKeys.length}
            </span>
          )}
          <ChevronDown className={cn("h-4 w-4 text-ink-soft transition", open && "rotate-180")} />
        </button>
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

      {open && (
        <div className="mt-4 flex flex-col gap-4">
          {/* 도메인 — 색 스와치 */}
          <section>
            <p className="mb-2 text-label-sm font-bold uppercase tracking-wide text-ink-soft">
              도메인
            </p>
            <div className="flex flex-wrap gap-2">
              {CARD_DOMAINS.map((d) => {
                const on = active("domain", d.slug);
                return (
                  <button
                    key={d.slug}
                    type="button"
                    onClick={() => toggle("domain", d.slug)}
                    aria-pressed={on}
                    className={cn(
                      "group flex flex-col items-center gap-1 rounded-xl px-2 py-1.5 transition",
                      on ? "bg-primary/10" : "hover:bg-subcanvas",
                    )}
                  >
                    <span
                      className={cn(
                        "grid h-9 w-9 place-items-center rounded-full ring-1 ring-black/10 transition",
                        on
                          ? "scale-110 ring-2 ring-primary ring-offset-2 ring-offset-card"
                          : "opacity-75 group-hover:opacity-100",
                      )}
                      style={{ backgroundColor: d.color }}
                    />
                    <span
                      className={cn(
                        "text-[11px] font-bold",
                        on ? "text-primary-strong" : "text-ink-soft",
                      )}
                    >
                      {d.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* 코스트 */}
          <section>
            <p className="mb-2 text-label-sm font-bold uppercase tracking-wide text-ink-soft">
              코스트
            </p>
            <div className="flex flex-wrap gap-1.5">
              {COSTS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggle("cost", c)}
                  aria-pressed={active("cost", c)}
                  className={cn(
                    "grid h-9 w-9 place-items-center rounded-xl text-body-md font-black transition",
                    active("cost", c)
                      ? "bg-primary text-white shadow-sm"
                      : "bg-subcanvas text-ink-soft hover:bg-subcanvas/70 hover:text-ink",
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </section>

          <PillGroup
            title="유형"
            items={CARD_TYPES.map((t) => ({ key: t.slug, label: t.label }))}
            isOn={(k) => active("type", k)}
            onPick={(k) => toggle("type", k)}
          />
          <PillGroup
            title="확장팩"
            items={CARD_SETS.map((s) => ({ key: s.code, label: `${s.code} ${s.label}` }))}
            isOn={(k) => active("setCode", k)}
            onPick={(k) => toggle("setCode", k)}
          />
          <PillGroup
            title="레어도"
            items={CARD_RARITIES.map((r) => ({ key: r.slug, label: r.label }))}
            isOn={(k) => active("rarity", k)}
            onPick={(k) => toggle("rarity", k)}
          />
        </div>
      )}
    </div>
  );
}

function PillGroup({
  title,
  items,
  isOn,
  onPick,
}: {
  title: string;
  items: { key: string; label: string }[];
  isOn: (key: string) => boolean;
  onPick: (key: string) => void;
}) {
  return (
    <section>
      <p className="mb-2 text-label-sm font-bold uppercase tracking-wide text-ink-soft">{title}</p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((it) => (
          <button
            key={it.key}
            type="button"
            onClick={() => onPick(it.key)}
            aria-pressed={isOn(it.key)}
            className={cn(
              "rounded-full px-3 py-1.5 text-body-sm font-semibold transition",
              isOn(it.key)
                ? "bg-primary text-white shadow-sm"
                : "bg-subcanvas text-ink-soft hover:bg-subcanvas/70 hover:text-ink",
            )}
          >
            {it.label}
          </button>
        ))}
      </div>
    </section>
  );
}
