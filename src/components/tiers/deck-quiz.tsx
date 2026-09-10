"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Wand2, X, RotateCcw, ArrowRight } from "lucide-react";

import { TIER_DECKS } from "@/lib/data/tier-list";
import { QUIZ_QUESTIONS, scoreQuiz, type QuizResult } from "@/lib/data/deck-quiz";
import { cn } from "@/lib/utils";

const DECK_HREF = "/community/deck-guide";
const listHref = (d: { guidePostId?: string }) =>
  d.guidePostId ? `/community/post/${d.guidePostId}` : DECK_HREF;
const deckOf = (id: string) => TIER_DECKS.find((d) => d.id === id) ?? null;

/** "내 MBTI 덱 찾기" — /tiers 안에서 모달로 뜬다. */
export function DeckQuiz({ images = {} }: { images?: Record<string, string> }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(QUIZ_QUESTIONS.map(() => null));

  const total = QUIZ_QUESTIONS.length;
  const done = step >= total;
  const result: QuizResult | null = done ? scoreQuiz(answers) : null;
  const deck = result ? deckOf(result.deckId) : null;
  const worst = result ? deckOf(result.worstDeckId) : null;

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
        내 MBTI 덱 찾기
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-scrim/60 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-line bg-card shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-line/60 px-5 py-3">
              <h2 className="flex items-center gap-1.5 font-display text-title-md font-bold text-ink">
                <Wand2 className="h-4 w-4 text-primary" />
                내 MBTI 덱 찾기
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

            <div className="overflow-y-auto p-5">
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
              ) : result && deck ? (
                <div>
                  {/* 폴라로이드 — 대표 덱 아트 */}
                  <div className="mx-auto w-fit -rotate-2">
                    <div className="rounded-[10px] bg-white p-2 pb-8 shadow-[0_8px_24px_rgba(0,0,0,0.18)] dark:bg-neutral-200">
                      <div className="relative aspect-[744/1039] w-40 overflow-hidden rounded-sm bg-subcanvas">
                        {images[deck.id] ? (
                          <Image src={images[deck.id]} alt={deck.name} fill sizes="160px" className="object-contain" />
                        ) : (
                          <div className="grid h-full place-items-center text-body-sm text-neutral-500">
                            {deck.keyCard}
                          </div>
                        )}
                      </div>
                      <p className="mt-1.5 text-center font-display text-title-lg font-black text-neutral-800">
                        {deck.name}
                      </p>
                    </div>
                  </div>

                  {/* 유형 타이틀 */}
                  <div className="mt-5 text-center">
                    <p className="text-label-sm font-bold text-ink-soft">당신의 유형은…</p>
                    <p className="mt-1 font-display text-headline-sm font-black leading-tight text-primary-strong">
                      {result.type.nickname} {deck.name}
                    </p>
                    <span className="mx-auto mt-2 block h-1 w-8 rounded-full bg-primary/40" />
                  </div>

                  {/* 해시태그 */}
                  <p className="mt-4 flex flex-wrap gap-x-2 gap-y-1 text-body-sm font-bold text-ink">
                    {result.type.hashtags.map((h) => (
                      <span key={h}>{h}</span>
                    ))}
                    <span className="text-primary-strong">#{result.type.code}</span>
                  </p>

                  {/* 특징 */}
                  <ul className="mt-3 flex flex-col gap-2">
                    {result.type.traits.map((t) => (
                      <li key={t} className="flex gap-2 text-body-sm text-ink">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>

                  {/* 잘 맞는 / 안 맞는 챔피언 */}
                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <MatchCard label="나와 잘 맞는 챔피언" tone="good" deck={deck} img={images[deck.id]} onNav={() => setOpen(false)} />
                    {worst && (
                      <MatchCard
                        label="나와 잘 안 맞는 챔피언"
                        tone="bad"
                        deck={worst}
                        img={images[worst.id]}
                        onNav={() => setOpen(false)}
                      />
                    )}
                  </div>

                  <div className="mt-5 flex items-center justify-center gap-4">
                    <Link
                      href={listHref(deck)}
                      onClick={() => setOpen(false)}
                      className="inline-flex items-center gap-1 rounded-full bg-primary px-4 py-2 text-label-md font-bold text-white transition hover:bg-primary-container"
                    >
                      덱리스트 보기 <ArrowRight className="h-4 w-4" />
                    </Link>
                    <button
                      type="button"
                      onClick={reset}
                      className="inline-flex items-center gap-1.5 text-label-md font-bold text-ink-soft hover:text-ink"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      다시 하기
                    </button>
                  </div>
                </div>
              ) : (
                <p className="py-8 text-center text-body-sm text-ink-soft">결과를 불러오지 못했어요.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function MatchCard({
  label,
  tone,
  deck,
  img,
  onNav,
}: {
  label: string;
  tone: "good" | "bad";
  deck: { id: string; name: string; keyCard: string; guidePostId?: string };
  img?: string;
  onNav: () => void;
}) {
  return (
    <Link
      href={listHref(deck)}
      onClick={onNav}
      className="flex flex-col items-center rounded-xl border border-line bg-subcanvas/40 p-2.5 transition hover:border-primary/40"
    >
      <span
        className={cn(
          "text-[11px] font-black",
          tone === "good" ? "text-emerald" : "text-coral",
        )}
      >
        {label}
      </span>
      <span className="relative mt-1.5 aspect-[744/1039] w-full overflow-hidden rounded bg-subcanvas">
        {img ? (
          <Image src={img} alt={deck.name} fill sizes="140px" className="object-contain" />
        ) : (
          <span className="grid h-full place-items-center text-[11px] text-ink-soft">{deck.keyCard}</span>
        )}
      </span>
      <span className="mt-1.5 text-label-sm font-bold text-ink">{deck.name}</span>
    </Link>
  );
}
