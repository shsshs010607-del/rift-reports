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
  ArrowRight,
} from "lucide-react";

import { PatchBanner } from "@/components/home/patch-banner";
import { HomeSidebar } from "@/components/home/home-sidebar";
import { SnsChannels } from "@/components/home/sns-channels";
import { ChannelBanner } from "@/components/home/channel-banner";
import { MetaSnapshot } from "@/components/home/meta-snapshot";
import { OfficialLinks } from "@/components/home/official-links";
import { RecentTrades } from "@/components/home/recent-trades";

export const revalidate = 60;

const SECTIONS = [
  { href: "/cards", label: "카드 정보", desc: "전체 카드 DB · 검색", icon: LayoutGrid },
  { href: "/deck-simulator", label: "덱 시뮬레이터", desc: "덱 빌드 · 공유", icon: Layers },
  { href: "/trading", label: "트레이딩", desc: "카드 시세 · 거래글", icon: ArrowUpDown },
  { href: "/community", label: "커뮤니티", desc: "공략 · 잡담 · 질문", icon: MessagesSquare },
  { href: "/rules", label: "초보자 가이드", desc: "규칙 · 용어", icon: BookOpen },
  { href: "/shops", label: "주변 매장", desc: "공인 카드샵 찾기", icon: Store },
  { href: "/tournaments", label: "다가오는 대회", desc: "매장 대회 · 이벤트", icon: Trophy },
];

/** 홈 = 팬 사이트 랜딩(집계/피드). 덱 티어리스트는 /tiers 로 분리됨. */
export default function HomePage() {
  return (
    <div className="flex flex-col gap-9">
      <PatchBanner />

      <section className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary-wash via-card to-card p-6 sm:p-9">
        <p className="text-label-lg font-bold uppercase tracking-wide text-primary-strong">
          Riftbound 한국 팬 허브
        </p>
        <h1 className="mt-2 font-display text-display-hero-mobile text-ink sm:text-display-hero">
          리프트 리포트
        </h1>
        <p className="mt-3 max-w-xl text-body-lg text-ink-soft">
          리프트바운드(Riftbound) TCG 티어리스트 · 카드 DB · 덱 시뮬레이터 · 시세 · 매장 대회 ·
          커뮤니티를 한곳에서.
        </p>
        <div className="mt-5 flex flex-wrap gap-2.5">
          <Link href="/tiers" className="btn-primary">
            덱 티어리스트 보기
          </Link>
          <Link href="/cards" className="btn-ghost">
            카드 정보
          </Link>
        </div>
      </section>

      <ChannelBanner />

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
        <div className="flex flex-col gap-8">
          <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-subcanvas/50" />}>
            <MetaSnapshot />
          </Suspense>

          <section>
            <h2 className="section-title mb-3">바로가기</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {SECTIONS.map((s) => (
                <Link
                  key={s.href}
                  href={s.href}
                  className="note-card group flex items-center gap-3.5 p-4 pr-6 transition hover:-translate-y-0.5 hover:shadow-e2"
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary-fixed text-primary-strong">
                    <s.icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-body-lg font-bold text-ink group-hover:text-primary-strong">
                      {s.label}
                    </span>
                    <span className="block text-body-sm text-ink-soft">{s.desc}</span>
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-ink-soft transition group-hover:translate-x-0.5 group-hover:text-primary-strong" />
                </Link>
              ))}
            </div>
          </section>
        </div>

        <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-subcanvas/50" />}>
          <HomeSidebar />
        </Suspense>
      </div>

      <OfficialLinks />

      <Suspense fallback={null}>
        <RecentTrades />
      </Suspense>

      <SnsChannels />

      <p className="rounded-2xl border border-line bg-subcanvas/40 p-4 text-body-sm leading-relaxed text-ink-soft">
        <strong className="text-ink">[비공식 팬 사이트]</strong> 리프트 리포트는 TCG
        &lsquo;리프트바운드(Riftbound)&rsquo; 팬과 플레이어를 위한 비공식 커뮤니티입니다. Riftbound /
        League of Legends 관련 자산의 저작권은 Riot Games 에 있습니다.
      </p>
    </div>
  );
}
