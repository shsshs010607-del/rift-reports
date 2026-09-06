"use client";

import { useCallback, useState } from "react";
import { RotateCcw, Shuffle } from "lucide-react";

import type { ResolvedEntry } from "@/lib/types/deck";
import { type DrawState, openingDraw, mulligan, buildLibrary } from "@/lib/deck/draw";
import { DECK_RULES, CARD_DOMAINS, CARD_TYPES } from "@/lib/constants";
import { LocalizedCard } from "@/components/cards/localized-card";
import { cn } from "@/lib/utils";

const DOMAIN_COLOR = new Map(CARD_DOMAINS.map((d) => [d.slug, d.color]));
const TYPE_LABEL = new Map(CARD_TYPES.map((t) => [t.slug, t.label]));

/**
 * 샘플 핸드 패널 — 메인덱을 섞어 4장을 뽑고 멀리건 1회.
 */
export function SampleHand({
  mainEntries,
  deckName,
}: {
  mainEntries: ResolvedEntry[];
  deckName: string;
}) {
  const libSize = buildLibrary(mainEntries).length;
  const [state, setState] = useState<DrawState | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const redraw = useCallback(() => {
    setState(openingDraw(mainEntries));
    setSelected(new Set());
  }, [mainEntries]);

  const toggle = (i: number) => {
    if (!state || state.mulliganed) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else if (next.size < DECK_RULES.mulliganMax) next.add(i);
      return next;
    });
  };

  const applyMulligan = () => {
    setState((s) => (s ? mulligan(s, [...selected]) : s));
    setSelected(new Set());
  };

  if (libSize === 0) {
    return (
      <p className="rounded-xl border-2 border-dashed border-line bg-subcanvas/40 p-8 text-center text-body-sm text-ink-soft">
        메인덱에 카드를 넣으면 오프닝 핸드를 뽑을 수 있습니다.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-label-lg font-bold text-ink">오프닝 핸드 · {DECK_RULES.openingHand}장</p>
          <p className="text-label-sm text-ink-soft">
            {deckName} · 메인덱 {libSize}장
            {libSize < DECK_RULES.openingHand && ` (${DECK_RULES.openingHand}장 미만)`}
          </p>
        </div>
        <button type="button" onClick={redraw} className="btn-ghost !py-1.5 !text-label-md">
          <RotateCcw className="h-4 w-4" />
          {state ? "새로 섞기" : "뽑기"}
        </button>
      </div>

      {!state ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {Array.from({ length: DECK_RULES.openingHand }).map((_, i) => (
            <div key={i} className="aspect-[5/7] rounded-xl border-2 border-dashed border-line bg-subcanvas/40" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {state.hand.map((card, i) => {
              const picked = selected.has(i);
              return (
                <button
                  type="button"
                  key={`${card.id}-${i}`}
                  onClick={() => toggle(i)}
                  disabled={state.mulliganed}
                  className={cn(
                    "flex flex-col overflow-hidden rounded-xl border-2 bg-subcanvas text-left transition",
                    picked ? "border-primary ring-2 ring-primary/30" : "border-line",
                    !state.mulliganed && "hover:border-primary/50",
                  )}
                >
                  <div className="relative">
                    <LocalizedCard card={card} sizes="150px" className="!rounded-none" />
                    {typeof card.cost === "number" && (
                      <span className="absolute left-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-ink/80 text-label-sm font-bold text-card">
                        {card.cost}
                      </span>
                    )}
                    <span className="absolute right-1 top-1 flex gap-0.5">
                      {card.domains.map((d) => (
                        <span
                          key={d}
                          className="h-2.5 w-2.5 rounded-full ring-1 ring-white/60"
                          style={{ backgroundColor: DOMAIN_COLOR.get(d) ?? "#999" }}
                        />
                      ))}
                    </span>
                    {picked && (
                      <span className="absolute inset-x-0 bottom-0 bg-primary/90 py-0.5 text-center text-label-sm font-bold text-white">
                        교체
                      </span>
                    )}
                  </div>
                  <div className="p-1.5">
                    <p className="truncate text-label-md font-semibold text-ink">{card.name}</p>
                    <p className="text-label-sm text-ink-soft">{TYPE_LABEL.get(card.type) ?? card.type}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-label-sm text-ink-soft">
              {state.mulliganed
                ? "멀리건을 사용했습니다."
                : selected.size > 0
                  ? `${selected.size}장 교체 예정`
                  : "교체할 카드 선택 (안 하고 확정하면 킵)"}
            </p>
            <button
              type="button"
              onClick={applyMulligan}
              disabled={state.mulliganed}
              className="btn-primary !py-1.5 !text-label-md disabled:opacity-40"
            >
              <Shuffle className="h-4 w-4" />
              멀리건 확정
            </button>
          </div>
        </>
      )}
    </div>
  );
}
