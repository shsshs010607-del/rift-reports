"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Wand2, X, RotateCcw, ArrowRight, Share2, Check, Download, Sparkles } from "lucide-react";

import { TIER_DECKS } from "@/lib/data/tier-list";
import { MBTI_TYPES, QUIZ_QUESTIONS, scoreQuiz, type QuizResult } from "@/lib/data/deck-quiz";
import { renderQuizResultImage, type QuizImageTheme } from "@/lib/quiz/quiz-image";
import { cn } from "@/lib/utils";

const DECK_HREF = "/community/deck-guide";
const listHref = (d: { guidePostId?: string }) =>
  d.guidePostId ? `/community/post/${d.guidePostId}` : DECK_HREF;
const deckOf = (id: string) => TIER_DECKS.find((d) => d.id === id) ?? null;

const THEME_SWATCH: { id: QuizImageTheme; label: string; cls: string }[] = [
  { id: "violet", label: "보라", cls: "bg-gradient-to-br from-[#4a3aa8] to-[#0d0a24]" },
  { id: "gold", label: "골드", cls: "bg-gradient-to-br from-[#8a5a1e] to-[#1a1006]" },
  { id: "midnight", label: "미드나잇", cls: "bg-gradient-to-br from-[#164a6b] to-[#020608]" },
];

/** "내 MBTI 덱 찾기" — /tiers 안에서 전체 화면 오버레이로 뜬다. `?quiz` 파라미터가 있으면 자동 오픈. */
export function DeckQuiz({ images = {} }: { images?: Record<string, string> }) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const sharedCode = (params.get("mbti") ?? "").toUpperCase();
  const sharedType = MBTI_TYPES[sharedCode] ?? null;
  const wantOpen = params.get("quiz") != null || sharedType != null;

  const [open, setOpen] = useState(wantOpen);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(QUIZ_QUESTIONS.map(() => null));
  const [copied, setCopied] = useState(false);
  const [theme, setTheme] = useState<QuizImageTheme>("violet");
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [imgBlob, setImgBlob] = useState<Blob | null>(null);
  const [rendering, setRendering] = useState(false);
  const [shared, setShared] = useState(false);

  // 상단 메뉴/공유링크로 ?quiz·?mbti 가 들어오면 (이미 마운트돼 있어도) 연다.
  useEffect(() => {
    if (wantOpen) setOpen(true);
  }, [wantOpen]);

  // 닫으면 ?quiz·?mbti 파라미터를 URL 에서 정리.
  useEffect(() => {
    if (!open && wantOpen) router.replace(pathname, { scroll: false });
  }, [open, wantOpen, pathname, router]);

  const total = QUIZ_QUESTIONS.length;
  const done = step >= total;
  const result: QuizResult | null = sharedType
    ? { type: sharedType, deckId: sharedType.deckId, worstDeckId: sharedType.worstDeckId }
    : done
      ? scoreQuiz(answers)
      : null;
  const deck = result ? deckOf(result.deckId) : null;
  const worst = result ? deckOf(result.worstDeckId) : null;

  // 결과가 정해지거나 테마를 바꾸면 인스타용 이미지를 다시 렌더.
  useEffect(() => {
    if (!result || !deck) return;
    let cancelled = false;
    setRendering(true);
    renderQuizResultImage({
      type: result.type,
      deckName: deck.name,
      deckArt: images[deck.id] ?? null,
      theme,
    })
      .then((blob) => {
        if (cancelled) return;
        setImgBlob(blob);
        setImgUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return URL.createObjectURL(blob);
        });
      })
      .finally(() => !cancelled && setRendering(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result?.type.code, deck?.id, theme]);

  // 언마운트 시 objectURL 정리.
  useEffect(() => {
    return () => {
      if (imgUrl) URL.revokeObjectURL(imgUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fileName = useMemo(
    () => (result ? `riba-gg-mbti-${result.type.code.toLowerCase()}.png` : "riba-gg-mbti.png"),
    [result],
  );

  function downloadImage() {
    if (!imgUrl) return;
    const a = document.createElement("a");
    a.href = imgUrl;
    a.download = fileName;
    a.click();
  }

  async function shareImage() {
    if (!imgBlob || !result || !deck) return;
    const file = new File([imgBlob], fileName, { type: "image/png" });
    const text = `내 MBTI 덱은 「${result.type.nickname} ${deck.name}」 #${result.type.code} #리바지지MBTI덱`;
    try {
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "내 MBTI 덱 · 리바지지", text });
        setShared(true);
        setTimeout(() => setShared(false), 2000);
        return;
      }
    } catch {
      /* 사용자가 공유 취소 — 아래 다운로드 폴백으로 진행 */
    }
    downloadImage();
  }

  async function shareLink() {
    if (!result || !deck) return;
    const url = `${window.location.origin}/tiers?mbti=${result.type.code}`;
    const text = `내 MBTI 덱은 「${result.type.nickname} ${deck.name}」 (#${result.type.code})`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "내 MBTI 덱 · 리바지지", text, url });
      } else {
        await navigator.clipboard.writeText(`${text}\n${url}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      }
    } catch {
      /* 사용자가 공유 취소 */
    }
  }

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
        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-label-md font-bold text-white shadow-[0_4px_14px_rgba(70,72,212,0.3)] transition hover:bg-primary-container"
      >
        <Wand2 className="h-4 w-4" />
        내 MBTI 덱 찾기
      </button>

      {open && (
        <div className="fixed inset-0 z-[70] overflow-y-auto bg-[#0d0a24]">
          {/* 장식 배경 */}
          <div className="pointer-events-none fixed inset-0 overflow-hidden">
            <div className="absolute -left-32 -top-32 h-[520px] w-[520px] rounded-full bg-primary/30 blur-[120px]" />
            <div className="absolute -bottom-40 -right-24 h-[460px] w-[460px] rounded-full bg-[#e8b84b]/20 blur-[120px]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.06),transparent_60%)]" />
          </div>

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="fixed right-5 top-5 z-10 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20"
            aria-label="닫기"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="relative mx-auto flex min-h-full w-full max-w-xl flex-col items-center px-5 py-14 sm:py-20">
            <p className="flex items-center gap-1.5 text-label-md font-bold uppercase tracking-[0.2em] text-white/50">
              <Sparkles className="h-4 w-4" />
              RIBA.GG
            </p>
            <h2 className="mt-2 text-center font-display text-[clamp(28px,6vw,44px)] font-black leading-tight text-white">
              내 <span className="text-[#e8b84b]">MBTI</span> 덱 찾기
            </h2>

            <div className="mt-8 w-full rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur-sm sm:p-8">
              {!done && !sharedType ? (
                <>
                  <div className="mb-5 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-[#e8b84b] transition-all"
                        style={{ width: `${(step / total) * 100}%` }}
                      />
                    </div>
                    <span className="text-label-sm font-bold text-white/60">
                      {step + 1}/{total}
                    </span>
                  </div>

                  <p className="mb-5 text-center text-body-lg font-bold text-white">
                    {QUIZ_QUESTIONS[step].question}
                  </p>

                  <div className="flex flex-col gap-2.5">
                    {QUIZ_QUESTIONS[step].options.map((opt, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => pick(i)}
                        className="rounded-xl border border-white/15 bg-white/5 px-4 py-3.5 text-left text-body-md text-white transition hover:border-[#e8b84b]/60 hover:bg-[#e8b84b]/10"
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {step > 0 && (
                    <button
                      type="button"
                      onClick={() => setStep((s) => s - 1)}
                      className="mt-4 text-label-sm font-bold text-white/50 hover:text-white"
                    >
                      ← 이전
                    </button>
                  )}
                </>
              ) : result && deck ? (
                <div>
                  {/* 유형 타이틀 */}
                  <div className="text-center">
                    <p className="text-label-sm font-bold text-white/50">당신의 유형은…</p>
                    <p className="mt-1 font-display text-[clamp(32px,7vw,48px)] font-black leading-tight text-[#e8b84b]">
                      {result.type.code}
                    </p>
                    <p className="mt-1 text-title-md font-bold text-white">
                      {result.type.nickname} · {deck.name}
                    </p>
                  </div>

                  {/* 인스타 공유 이미지 미리보기 */}
                  <div className="mx-auto mt-6 w-full max-w-[240px]">
                    <div className="relative aspect-[1080/1350] w-full overflow-hidden rounded-xl border border-white/15 bg-black/30 shadow-xl">
                      {imgUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={imgUrl} alt="MBTI 덱 결과 카드" className="h-full w-full object-cover" />
                      ) : (
                        <div className="grid h-full place-items-center text-body-sm text-white/40">
                          {rendering ? "이미지 만드는 중…" : "미리보기"}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 배경 테마 선택 */}
                  <div className="mt-4 flex items-center justify-center gap-2.5">
                    {THEME_SWATCH.map((sw) => (
                      <button
                        key={sw.id}
                        type="button"
                        onClick={() => setTheme(sw.id)}
                        title={sw.label}
                        className={cn(
                          "h-8 w-8 rounded-full ring-2 ring-offset-2 ring-offset-[#0d0a24] transition",
                          sw.cls,
                          theme === sw.id ? "ring-[#e8b84b]" : "ring-transparent hover:ring-white/30",
                        )}
                      />
                    ))}
                  </div>

                  {/* 액션 버튼 */}
                  <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
                    <button
                      type="button"
                      onClick={shareImage}
                      disabled={!imgBlob}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#e8b84b] px-4 py-2.5 text-label-md font-bold text-[#241a00] transition hover:brightness-105 disabled:opacity-50"
                    >
                      {shared ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
                      {shared ? "공유됨" : "인스타그램에 공유"}
                    </button>
                    <button
                      type="button"
                      onClick={downloadImage}
                      disabled={!imgUrl}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 px-4 py-2.5 text-label-md font-bold text-white/80 transition hover:border-white/40 hover:text-white disabled:opacity-50"
                    >
                      <Download className="h-3.5 w-3.5" />
                      이미지 저장
                    </button>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-center gap-4">
                    <Link
                      href={listHref(deck)}
                      onClick={() => setOpen(false)}
                      className="inline-flex items-center gap-1 text-label-md font-bold text-white/80 hover:text-white"
                    >
                      덱리스트 보기 <ArrowRight className="h-4 w-4" />
                    </Link>
                    <button
                      type="button"
                      onClick={shareLink}
                      className="inline-flex items-center gap-1.5 text-label-md font-bold text-white/60 hover:text-white"
                    >
                      {copied ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
                      {copied ? "링크 복사됨" : "링크만 공유"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        reset();
                        if (sharedType) router.replace(pathname, { scroll: false });
                      }}
                      className="inline-flex items-center gap-1.5 text-label-md font-bold text-white/60 hover:text-white"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      다시
                    </button>
                  </div>

                  {/* 잘 맞는 / 안 맞는 챔피언 */}
                  <div className="mt-8 grid grid-cols-2 gap-3">
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
                </div>
              ) : (
                <p className="py-8 text-center text-body-sm text-white/60">결과를 불러오지 못했어요.</p>
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
      className="flex flex-col items-center rounded-xl border border-white/10 bg-white/[0.04] p-2.5 transition hover:border-white/25"
    >
      <span
        className={cn(
          "text-[11px] font-black",
          tone === "good" ? "text-emerald" : "text-coral",
        )}
      >
        {label}
      </span>
      <span className="relative mt-1.5 aspect-[744/1039] w-full overflow-hidden rounded bg-black/30">
        {img ? (
          <Image src={img} alt={deck.name} fill sizes="140px" className="object-contain" />
        ) : (
          <span className="grid h-full place-items-center text-[11px] text-white/50">{deck.keyCard}</span>
        )}
      </span>
      <span className="mt-1.5 text-label-sm font-bold text-white">{deck.name}</span>
    </Link>
  );
}
