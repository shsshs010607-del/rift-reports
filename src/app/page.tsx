import Link from "next/link";
import { Suspense } from "react";

import { PatchBanner } from "@/components/home/patch-banner";
import { HomeSidebar } from "@/components/home/home-sidebar";
import { SnsChannels } from "@/components/home/sns-channels";
import { TierBoard } from "@/components/tiers/tier-board";

export const revalidate = 60;

/**
 * 홈 = 덱 티어리스트 대시보드.
 * 좌: 티어 보드(임시 — 레전드 카드), 우: 리포트/인기글/시세/대회 사이드바.
 */
export default function HomePage() {
  return (
    <div className="flex flex-col gap-8">
      <PatchBanner />

      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="font-display text-headline-lg text-ink">덱 티어리스트</h1>
          <p className="mt-1 text-body-lg text-ink-soft">현재 메타 기준 · 덱을 누르면 공략으로 이동</p>
        </div>
        <Link
          href="/tiers"
          className="hidden text-label-md font-semibold text-primary-strong hover:underline sm:inline"
        >
          티어 표 전체 보기
        </Link>
      </div>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Suspense fallback={<BoardSkeleton />}>
          <TierBoard />
        </Suspense>
        <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-subcanvas/50" />}>
          <HomeSidebar />
        </Suspense>
      </div>

      <SnsChannels />

      <p className="rounded-2xl border border-line bg-subcanvas/40 p-4 text-body-sm leading-relaxed text-ink-soft">
        <strong className="text-ink">[비공식 팬 사이트]</strong> 리프트 리포트는 TCG
        &lsquo;리프트바운드(Riftbound)&rsquo; 팬과 플레이어를 위한 비공식 커뮤니티입니다. Riftbound /
        League of Legends 관련 자산의 저작권은 Riot Games 에 있습니다.
      </p>
    </div>
  );
}

function BoardSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-56 animate-pulse rounded-2xl bg-subcanvas/50" />
      ))}
    </div>
  );
}
