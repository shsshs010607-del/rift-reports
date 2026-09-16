import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  Layers,
  LayoutGrid,
  Trophy,
  Store,
  MessagesSquare,
  ArrowUpDown,
  BookOpen,
  Library,
} from "lucide-react";

import { HomeHeroCarousel } from "@/components/home/home-hero-carousel";
import { HomeQuickBar } from "@/components/home/home-quick-bar";
import { HomeBeginnerGuide } from "@/components/home/home-beginner-guide";
import { SnsChannels } from "@/components/home/sns-channels";
import { MetaSnapshot } from "@/components/home/meta-snapshot";
import { OfficialLinks } from "@/components/home/official-links";
import { HomeCommunity } from "@/components/home/home-community";
import { HomeReports } from "@/components/home/home-reports";
import { HomePriceMini } from "@/components/home/home-price-mini";
import { HomeExtras } from "@/components/home/home-extras";

// HomeCommunity/HomeReports/HomePriceMini/HomeExtras 가 쓰는 community.ts/prices.ts/
// queries.ts 의 safe() 래퍼가 cookies() 의 Next 내부 신호까지 try/catch 로 삼켜버려서,
// force-dynamic 없이는 빌드가 "/" 정적 생성을 시도하다 타임아웃/실패한다 — 지우지 말 것.
export const dynamic = "force-dynamic";

// canonical 은 원래 layout.tsx 루트에 "/" 로 박혀 있었는데, 하위 페이지가 각자
// canonical 을 안 정하면 그대로 상속돼서 사이트 전체 페이지가 죄다 홈을 표준
// URL로 선언하는 꼴이었다 — Search Console 이 "사용자가 선택한 표준 없는 중복
// 페이지"로 잡아낸 원인. 홈 것만 여기로 옮기고, 나머지 페이지는 각자 지정한다.
export const metadata: Metadata = { alternates: { canonical: "/" } };

const SECTIONS = [
  { href: "/community", label: "커뮤니티", icon: MessagesSquare },
  { href: "/cards", label: "카드 정보", icon: LayoutGrid },
  { href: "/collection", label: "내 컬렉션", icon: Library },
  { href: "/deck-simulator", label: "덱 시뮬레이터", icon: Layers },
  { href: "/trading", label: "트레이딩", icon: ArrowUpDown },
  { href: "/tiers", label: "덱 티어리스트", icon: Layers },
  { href: "/rules", label: "초보자 가이드", icon: BookOpen },
  { href: "/shops", label: "주변 매장", icon: Store },
  { href: "/tournaments", label: "다가오는 대회", icon: Trophy },
];

/** 홈 = 커뮤니티 중심. 추천덱(압축) + 최신글 좌측, 인기글·시세 우측. */
export default function HomePage() {
  return (
    <div className="flex flex-col gap-6">
      <HomeHeroCarousel />

      <HomeQuickBar />

      <HomeBeginnerGuide />

      {/* 좌: 추천덱(압축) + 커뮤니티 최신글 / 우: 인기글 + 시세 */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start">
        <div className="flex flex-col gap-5">
          <Suspense fallback={<div className="h-28 animate-pulse rounded-2xl bg-subcanvas/50" />}>
            <MetaSnapshot />
          </Suspense>
          <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-subcanvas/50" />}>
            <HomeCommunity />
          </Suspense>
        </div>
        <div className="flex flex-col gap-5">
          <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-subcanvas/50" />}>
            <HomeReports />
          </Suspense>
          <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-subcanvas/50" />}>
            <HomePriceMini />
          </Suspense>
        </div>
      </div>

      <OfficialLinks />

      <section>
        <h2 className="section-title mb-3">전체 메뉴</h2>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {SECTIONS.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="note-card group flex flex-col items-center gap-2 p-4 pr-6 text-center transition hover:-translate-y-0.5 hover:shadow-e2"
            >
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary-fixed text-primary-strong">
                <s.icon className="h-5 w-5" />
              </span>
              <span className="text-body-sm font-bold text-ink group-hover:text-primary-strong">
                {s.label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-subcanvas/50" />}>
        <HomeExtras />
      </Suspense>

      <SnsChannels />

      <p className="rounded-2xl border border-line bg-subcanvas/40 p-4 text-body-sm leading-relaxed text-ink-soft">
        <strong className="text-ink">[비공식 팬 사이트]</strong> 리바지지(RIBA.GG)는 TCG
        &lsquo;리프트바운드(Riftbound)&rsquo; 팬과 플레이어를 위한 비공식 커뮤니티입니다. Riftbound /
        League of Legends 관련 자산의 저작권은 Riot Games 에 있습니다.
      </p>
    </div>
  );
}
