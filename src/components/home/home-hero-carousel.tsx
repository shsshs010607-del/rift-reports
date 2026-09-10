"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Layers, MessagesSquare, Sparkles, TrendingUp } from "lucide-react";

import { T1EditionBanner } from "@/components/home/t1-edition-banner";
import { cn } from "@/lib/utils";

/**
 * 홈 상단 프로모 캐러셀 — 한 번에 2개(모바일 1개) 노출, 번호로 넘긴다.
 * 슬라이드는 각자 완결된 카드. 새 배너는 SLIDES 에 추가만 하면 됨.
 */
const SLIDES: { key: string; node: React.ReactNode }[] = [
  { key: "intro", node: <IntroSlide /> },
  { key: "ogn", node: <OgnSlide /> },
  { key: "t1", node: <T1EditionBanner /> },
  { key: "tools", node: <ToolsSlide /> },
];

export function HomeHeroCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  function go(i: number) {
    const track = trackRef.current;
    const first = track?.children[0] as HTMLElement | undefined;
    const child = track?.children[i] as HTMLElement | undefined;
    if (track && first && child) {
      // 부드러운 스크롤은 scroll-snap 컨테이너에서 Chromium 버그로 되돌아가므로 즉시 이동.
      track.scrollTo({ left: child.offsetLeft - first.offsetLeft });
    }
    setActive(i);
  }

  // 수동 스크롤에도 번호 상태를 맞춘다.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const kids = Array.from(track.children) as HTMLElement[];
        // 끝까지 스크롤됐으면 마지막 슬라이드로 (마지막은 왼쪽 정렬이 불가능).
        if (track.scrollLeft + track.clientWidth >= track.scrollWidth - 4) {
          setActive(kids.length - 1);
          return;
        }
        const base = kids[0]?.offsetLeft ?? 0;
        const left = track.scrollLeft;
        let nearest = 0;
        let best = Infinity;
        kids.forEach((k, i) => {
          const dist = Math.abs(k.offsetLeft - base - left);
          if (dist < best) {
            best = dist;
            nearest = i;
          }
        });
        setActive(nearest);
      });
    };
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      track.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section>
      <div
        ref={trackRef}
        className="-mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {SLIDES.map((s) => (
          <div
            key={s.key}
            className="min-w-0 shrink-0 snap-start basis-full sm:basis-[calc(50%_-_0.5rem)]"
          >
            {s.node}
          </div>
        ))}
      </div>

      {/* 번호 페이저 */}
      <div className="mt-2.5 flex items-center justify-center gap-1.5">
        {SLIDES.map((s, i) => (
          <button
            key={s.key}
            type="button"
            onClick={() => go(i)}
            aria-label={`${i + 1}번 배너`}
            aria-current={active === i}
            className={cn(
              "grid h-7 w-7 place-items-center rounded-full text-label-sm font-bold transition",
              active === i
                ? "bg-primary text-white"
                : "bg-subcanvas text-ink-soft hover:bg-primary/10 hover:text-primary-strong",
            )}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </section>
  );
}

function SlideShell({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex h-full flex-col justify-center rounded-2xl border p-5", className)}>
      {children}
    </div>
  );
}

function IntroSlide() {
  return (
    <SlideShell className="border-primary/20 bg-gradient-to-br from-primary-wash via-card to-card">
      <p className="text-label-sm font-bold uppercase tracking-wide text-primary-strong">
        Riftbound 한국 팬 커뮤니티
      </p>
      <h2 className="mt-1 font-display text-headline-md leading-none text-ink">리바지지</h2>
      <p className="mt-0.5 font-display text-[11px] font-bold uppercase tracking-[0.2em] text-ink-soft/70">
        RIBA.GG
      </p>
      <p className="mt-2.5 text-body-sm leading-snug text-ink-soft">
        리프트바운드 TCG 국내 유저를 위한 정보·커뮤니티 허브 — 메타 덱, 카드 DB, 덱 시뮬레이터, 실시간
        시세, 매장 대회. <span className="text-ink-soft/70">모든 콘텐츠 한국 스탠다드 메타 기준.</span>
      </p>
      <div className="mt-3.5 flex flex-wrap gap-2">
        <Link
          href="/community"
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-label-sm font-bold text-white transition hover:bg-primary-container"
        >
          <MessagesSquare className="h-4 w-4" />
          커뮤니티
        </Link>
        <Link
          href="/tiers"
          className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-4 py-2 text-label-sm font-bold text-ink-soft transition hover:border-primary/40 hover:text-ink"
        >
          덱 티어리스트
        </Link>
      </div>
    </SlideShell>
  );
}

function OgnSlide() {
  return (
    <SlideShell className="border-line bg-card">
      <span className="inline-flex w-fit items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-label-sm font-bold text-white">
        <Sparkles className="h-3 w-3" />
        OGN · 9월 18일 출시
      </span>
      <p className="mt-2.5 text-body-md leading-snug text-ink-soft">
        리프트바운드 &lsquo;오리진&rsquo;이 9월 18일 한국 정식 출시됩니다. 카드 DB·덱 시뮬레이터·시세는
        지금 이용할 수 있어요.
      </p>
      <Link
        href="/rules"
        className="mt-3.5 inline-flex w-fit items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-label-sm font-bold text-white transition hover:bg-primary-container"
      >
        <BookOpen className="h-4 w-4" />
        초보자 가이드 바로가기
        <ArrowRight className="h-4 w-4" />
      </Link>
    </SlideShell>
  );
}

function ToolsSlide() {
  return (
    <SlideShell className="border-line bg-gradient-to-br from-tertiary/[0.07] via-card to-card">
      <p className="text-label-sm font-bold uppercase tracking-wide text-tertiary">지금 바로</p>
      <h2 className="mt-1 font-display text-headline-md leading-tight text-ink">덱 짜고 · 시세 보고</h2>
      <p className="mt-2 text-body-sm leading-snug text-ink-soft">
        전체 카드로 덱을 조립하고 오프닝 핸드를 돌려보세요. 카드 시세는 매일 갱신됩니다.
      </p>
      <div className="mt-3.5 flex flex-wrap gap-2">
        <Link
          href="/deck-simulator"
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-label-sm font-bold text-white transition hover:bg-primary-container"
        >
          <Layers className="h-4 w-4" />
          덱 시뮬레이터
        </Link>
        <Link
          href="/trading"
          className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-4 py-2 text-label-sm font-bold text-ink-soft transition hover:border-primary/40 hover:text-ink"
        >
          <TrendingUp className="h-4 w-4" />
          카드 시세
        </Link>
      </div>
    </SlideShell>
  );
}
