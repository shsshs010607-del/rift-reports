import { Suspense } from "react";
import Link from "next/link";
import {
  Layers,
  LayoutGrid,
  Trophy,
  Store,
  MessagesSquare,
  ArrowUpDown,
  BookOpen,
} from "lucide-react";

import { PatchBanner } from "@/components/home/patch-banner";
import { SnsChannels } from "@/components/home/sns-channels";
import { ChannelBanner } from "@/components/home/channel-banner";
import { HomeCardSearch } from "@/components/home/home-card-search";
import { MetaSnapshot } from "@/components/home/meta-snapshot";
import { OfficialLinks } from "@/components/home/official-links";
import { HomeCommunity } from "@/components/home/home-community";
import { HomePopular } from "@/components/home/home-popular";
import { HomePriceMini } from "@/components/home/home-price-mini";
import { HomeExtras } from "@/components/home/home-extras";

export const revalidate = 60;

const SECTIONS = [
  { href: "/community", label: "커뮤니티", icon: MessagesSquare },
  { href: "/cards", label: "카드 정보", icon: LayoutGrid },
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
      <PatchBanner />

      <section className="grid gap-5 rounded-3xl border border-primary/20 bg-gradient-to-br from-primary-wash via-card to-card p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-center">
        <div>
          <p className="text-label-md font-bold uppercase tracking-wide text-primary-strong">
            Riftbound 한국 팬 커뮤니티
          </p>
          <h1 className="mt-1.5 font-display text-headline-lg text-ink sm:text-display-hero-mobile">
            리바지지 · RIBA.GG
          </h1>
          <p className="mt-2 max-w-xl text-body-md text-ink-soft">
            리프트바운드(Riftbound) TCG 커뮤니티 · 덱 티어리스트 · 카드 DB · 시세 · 매장 대회.
          </p>
          <ChannelBanner className="mt-4" />
        </div>
        <HomeCardSearch />
      </section>

      {/* 좌: 추천덱(압축) + 커뮤니티 최신글 / 우: 인기글 + 시세 */}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start">
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
            <HomePopular />
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
