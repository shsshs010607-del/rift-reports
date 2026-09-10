import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Layers, MessagesSquare, TrendingUp, Wand2 } from "lucide-react";

import { CarouselClient } from "@/components/home/carousel-client";
import { T1EditionBanner } from "@/components/home/t1-edition-banner";

/**
 * 홈 상단 프로모 캐러셀 — 한 번에 1장, 번호 = 배너 순서.
 * 슬라이드는 전부 서버 컴포넌트, 스크롤/번호만 CarouselClient(클라).
 */
export function HomeHeroCarousel() {
  return (
    <CarouselClient>
      <IntroSlide />
      <MbtiSlide />
      <T1EditionBanner />
      <ToolsSlide />
    </CarouselClient>
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
    <div className={`flex h-full flex-col justify-center rounded-2xl border p-5 ${className ?? ""}`}>
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

/** 장식용 카드 아트 (Riot 공식 CDN) — MBTI 슬라이드. */
const MBTI_ART = [
  "https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/68e4d3230b785738ae9d86f780f7f5607ef11807-744x1040.png?accountingTag=RB",
  "https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/fbce641f5e4d8cdf2956e8ead5884b6cd3ccd90d-744x1040.png?accountingTag=RB",
];

function MbtiSlide() {
  return (
    <SlideShell className="border-tertiary/25 bg-gradient-to-br from-tertiary/[0.08] via-card to-card">
      <div className="flex items-center gap-4">
        <div className="relative hidden h-[104px] w-[92px] shrink-0 sm:block">
          {MBTI_ART.map((src, i) => (
            <span
              key={i}
              className="absolute left-0 top-1/2 block w-[60px] overflow-hidden rounded-[4px] shadow-lg ring-1 ring-black/10"
              style={{ transform: `translateX(${i * 48}%) translateY(-50%) rotate(${i ? 10 : -10}deg)`, zIndex: i ? 10 : 20 }}
            >
              <Image src={src} alt="" width={60} height={84} className="h-auto w-full" />
            </span>
          ))}
        </div>
        <div className="min-w-0">
          <p className="inline-flex items-center gap-1.5 text-label-sm font-bold uppercase tracking-wide text-tertiary">
            <Wand2 className="h-3.5 w-3.5" />
            8문항 · 16유형
          </p>
          <h2 className="mt-1 font-display text-headline-md leading-tight text-ink">
            내 MBTI에 맞는 덱은?
          </h2>
          <p className="mt-1.5 text-body-sm leading-snug text-ink-soft">
            성향 질문 8개로 MBTI를 뽑고, 16유형별 어울리는 리프트바운드 덱과 상극 덱을 알려드려요.
          </p>
        </div>
      </div>
      <div className="mt-3.5 flex flex-wrap gap-2">
        <Link
          href="/tiers?quiz=1"
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-label-sm font-bold text-white transition hover:bg-primary-container"
        >
          <Wand2 className="h-4 w-4" />
          MBTI 덱 찾기
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href="/tiers"
          className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-4 py-2 text-label-sm font-bold text-ink-soft transition hover:border-primary/40 hover:text-ink"
        >
          덱 티어표
        </Link>
      </div>
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
