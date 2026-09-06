"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { RotateCcw, Shuffle, X } from "lucide-react";

import type { ResolvedEntry } from "@/lib/types/deck";
import { type DrawState, openingDraw, mulligan, buildLibrary } from "@/lib/deck/draw";
import { DECK_RULES, CARD_DOMAINS, CARD_TYPES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const DOMAIN_COLOR = new Map(CARD_DOMAINS.map((d) => [d.slug, d.color]));
const TYPE_LABEL = new Map(CARD_TYPES.map((t) => [t.slug, t.label]));

/**
 * 오프닝 핸드 4장 드로우 + 멀리건 1회 시뮬레이션.
 * 메인덱(레전드/룬/전장 제외)만 대상으로 한다.
 */
export function OpeningHandModal({
  resolved,
  deckName,
  onClose,
}: {
  resolved: ResolvedEntry[];
  deckName: string;
  onClose: () => void;
}) {
  const libSize = buildLibrary(resolved).length;
  const [state, setState] = useState<DrawState>(() => openingDraw(resolved));
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const redraw = useCallback(() => {
    setState(openingDraw(resolved));
    setSelected(new Set());
  }, [resolved]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const toggle = (i: number) => {
    if (state.mulliganed) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else if (next.size < DECK_RULES.mulliganMax) next.add(i);
      return next;
    });
  };

  const applyMulligan = () => {
    setState((s) => mulligan(s, [...selected]));
    setSelected(new Set());
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-3xl flex-col gap-4 rounded-2xl border border-line bg-card p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-title-md font-bold text-ink">
              오프닝 핸드 · {DECK_RULES.openingHand}장
            </h2>
            <p className="text-body-sm text-ink-soft">
              {deckName} · 메인덱 {libSize}장
              {state.mulliganed ? " · 멀리건 완료" : " · 최대 2장까지 골라 덱 아래로 교체"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-subcanvas text-ink-soft hover:text-ink"
            aria-label="닫기"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {libSize < DECK_RULES.openingHand && (
          <p className="rounded-xl bg-error/5 p-2.5 text-label-sm text-error">
            메인덱이 {DECK_RULES.openingHand}장 미만이라 {state.hand.length}장만 뽑았습니다.
          </p>
        )}

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
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
                <div className="relative aspect-[5/7]">
                  {card.imageUrl ? (
                    <Image src={card.imageUrl} alt={card.name} fill sizes="180px" className="object-cover" />
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
                  <p className="text-label-sm text-ink-soft">
                    {TYPE_LABEL.get(card.type) ?? card.type}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-label-sm text-ink-soft">
            {state.mulliganed
              ? "이번 게임의 멀리건을 사용했습니다."
              : selected.size > 0
                ? `${selected.size}장 교체 예정`
                : "교체할 카드를 선택하세요 (선택 안 하고 확정하면 킵)."}
          </p>
          <div className="flex gap-1.5">
            <button type="button" onClick={redraw} className="btn-ghost !py-2 !text-label-md">
              <RotateCcw className="h-4 w-4" />
              새로 섞기
            </button>
            <button
              type="button"
              onClick={applyMulligan}
              disabled={state.mulliganed}
              className="btn-primary !py-2 !text-label-md disabled:opacity-40"
            >
              <Shuffle className="h-4 w-4" />
              멀리건 확정
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
