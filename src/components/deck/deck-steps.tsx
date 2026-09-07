"use client";

import { Check, ChevronRight, Sparkles } from "lucide-react";
import type { PoolTab } from "@/components/deck/card-pool";
import type { zoneCounts } from "@/lib/deck/deck-model";
import { cn } from "@/lib/utils";

type Counts = ReturnType<typeof zoneCounts>;

type Step = {
  tab: PoolTab;
  label: string;
  done: (c: Counts) => boolean;
  progress: (c: Counts) => string;
  hint: string;
};

const STEPS: Step[] = [
  {
    tab: "legend",
    label: "레전드",
    done: (c) => c.legend === 1,
    progress: (c) => `${c.legend}/1`,
    hint: "레전드를 골라 덱의 색(도메인)을 정하세요.",
  },
  {
    tab: "champion",
    label: "챔피언",
    done: (c) => c.champion === 1,
    progress: (c) => `${c.champion}/1`,
    hint: "레전드와 같은 이름의 챔피언을 지정 챔피언으로 넣으세요.",
  },
  {
    tab: "main",
    label: "메인덱",
    done: (c) => c.main >= 39 && c.main <= 59,
    progress: (c) => `${c.main}/39`,
    hint: "유닛·주문·도구로 메인덱을 39~59장 채우세요 (같은 카드 최대 3장).",
  },
  {
    tab: "battlefield",
    label: "전장",
    done: (c) => c.battlefield === 3,
    progress: (c) => `${c.battlefield}/3`,
    hint: "전장 카드를 3장 고르세요.",
  },
  {
    tab: "rune",
    label: "룬",
    done: (c) => c.rune === 12,
    progress: (c) => `${c.rune}/12`,
    hint: "룬은 레전드 색에 맞춰 12장 자동으로 채워집니다.",
  },
];

export function DeckSteps({
  counts,
  activeTab,
  valid,
  onGoto,
}: {
  counts: Counts;
  activeTab: PoolTab;
  valid: boolean;
  onGoto: (tab: PoolTab) => void;
}) {
  // 현재 안내할 단계: 아직 안 끝난 첫 단계
  const currentIdx = STEPS.findIndex((s) => !s.done(counts));
  const current = currentIdx === -1 ? null : STEPS[currentIdx];

  return (
    <div className="rounded-2xl border border-line bg-card p-2.5">
      <ol className="flex items-center gap-1 overflow-x-auto pb-1">
        {STEPS.map((s, i) => {
          const done = s.done(counts);
          const isCurrent = i === currentIdx;
          const isActive = activeTab === s.tab;
          return (
            <li key={s.tab} className="flex shrink-0 items-center">
              <button
                type="button"
                onClick={() => onGoto(s.tab)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-label-md font-bold transition",
                  done
                    ? "text-emerald"
                    : isCurrent || isActive
                      ? "bg-primary text-white"
                      : "text-ink-soft hover:bg-subcanvas",
                )}
              >
                <span
                  className={cn(
                    "grid h-4 w-4 shrink-0 place-items-center rounded-full text-[10px]",
                    done
                      ? "bg-emerald text-white"
                      : isCurrent || isActive
                        ? "bg-white/25"
                        : "bg-subcanvas text-ink-soft",
                  )}
                >
                  {done ? <Check className="h-2.5 w-2.5" /> : i + 1}
                </span>
                {s.label}
                <span className={cn("tabular-nums", done ? "text-emerald/70" : "opacity-70")}>
                  {s.progress(counts)}
                </span>
              </button>
              {i < STEPS.length - 1 && (
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-outline-variant" />
              )}
            </li>
          );
        })}
      </ol>

      <p
        className={cn(
          "mt-1 flex items-center gap-1.5 px-1 text-body-sm",
          valid ? "font-bold text-emerald" : "text-ink-soft",
        )}
      >
        <Sparkles className="h-3.5 w-3.5 shrink-0" />
        {valid
          ? "덱 완성! 샘플 핸드로 시험해 보거나 저장하세요."
          : (current?.hint ?? "규칙 위반을 확인하세요. 오른쪽 덱 목록에 표시됩니다.")}
      </p>
    </div>
  );
}
