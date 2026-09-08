"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Wand2, X, RotateCcw, ArrowRight } from "lucide-react";

import { TIER_DECKS } from "@/lib/data/tier-list";
import { QUIZ_QUESTIONS, scoreQuiz, type QuizResult } from "@/lib/data/deck-quiz";
import { TIER_STYLES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const DECK_HREF = "/community/deck-guide";

/** "내게 맞는 덱 유형" 테스트 — /tiers 안에서 모달로 뜬다. */
export function DeckQuiz() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(
    QUIZ_QUESTIONS.map(() => null),
  );

  const total = QUIZ_QUESTIONS.length;
  const done = step >= total;
  const result: QuizResult | null = done ? scoreQuiz(answers) : null;
  const deck = result ? TIER_DECKS.find((d) => d.id === result.deckId) : null;

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function reset() {
    setStep(0);
    setAnswers(QUIZ_QUESTIONS.map(() => null));
  }

  function pick(optIdx: number) {
    setAnswers((a) => a.map((v, i) => (i === step ? optIdx : v)));
    setStep((s) => s + 1);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          reset();
          setOpen(true);
        }}
        className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-label-md font-bold text-white shadow-[0_4px_14px_rgba(70,72,212,0.3)] transition hover:bg-primary-container"
      >
        <Wand2 className="h-4 w-4" />
        내게 맞는 덱 찾기
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="flex w-full max-w-md flex-col overflow-hidden rounded-2xl border border-line bg-card shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-line/60 px-5 py-3">
              <h2 className="flex items-center gap-1.5 font-display text-title-md font-bold text-ink">
                <Wand2 className="h-4 w-4 text-primary" />
                내게 맞는 덱 유형
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-full bg-subcanvas text-ink-soft hover:text-ink"
                aria-label="닫기"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5">
              {!done ? (
                <>
                  <div className="mb-3 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-subcanvas">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${(step / total) * 100}%` }}
                      />
                    </div>
                    <span className="text-label-sm font-bold text-ink-soft">
                      {step + 1}/{total}
                    </span>
                  </div>

                  <p className="mb-4 text-body-lg font-bold text-ink">
                    {QUIZ_QUESTIONS[step].question}
                  </p>

                  <div className="flex flex-col gap-2">
                    {QUIZ_QUESTIONS[step].options.map((opt, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => pick(i)}
                        className="rounded-xl border border-line bg-card px-4 py-3 text-left text-body-md text-ink transition hover:border-primary/50 hover:bg-primary/5"
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {step > 0 && (
                    <button
                      type="button"
                      onClick={() => setStep((s) => s - 1)}
                      className="mt-3 text-label-sm font-bold text-ink-soft hover:text-ink"
                    >
                      ← 이전
                    </button>
                  )}
                </>
              ) : (
                <div className="text-center">
                  <p className="text-label-sm font-bold uppercase tracking-wide text-primary-strong">
                    추천 덱 유형
                  </p>
                  <p className="mt-1 font-display text-headline-sm text-ink">
                    {result?.archetypeLabel}
                  </p>

                  {deck ? (
                    <div className="mt-4 rounded-2xl border border-line/70 bg-subcanvas/40 p-4">
                      <div className="flex items-center justify-center gap-2">
                        <span
                          className={cn(
                            "grid h-7 w-7 place-items-center rounded-md text-label-sm font-black text-white",
                            TIER_STYLES[deck.tier].dot,
                          )}
                        >
                          {deck.tier}
                        </span>
                        <p className="font-display text-title-md font-bold text-ink">{deck.name}</p>
                      </div>
                      <p className="mt-1 text-body-sm text-ink-soft">{deck.subtitle}</p>
                      <Link
                        href={deck.guidePostId ? `/community/post/${deck.guidePostId}` : DECK_HREF}
                        onClick={() => setOpen(false)}
                        className="mt-3 inline-flex items-center gap-1 rounded-full bg-primary px-4 py-2 text-label-md font-bold text-white transition hover:bg-primary-container"
                      >
                        공략 보기 <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  ) : (
                    <p className="mt-4 text-body-sm text-ink-soft">추천 덱을 찾지 못했어요.</p>
                  )}

                  <button
                    type="button"
                    onClick={reset}
                    className="mt-4 inline-flex items-center gap-1.5 text-label-md font-bold text-ink-soft hover:text-ink"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    다시 하기
                  </button>
                  <p className="mt-3 text-[11px] text-ink-soft/70">
                    ※ 문항·추천 로직은 준비 중입니다.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
