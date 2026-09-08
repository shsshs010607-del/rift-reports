import { Suspense } from "react";
import type { Metadata } from "next";

import { PageHeading } from "@/components/ui/page-heading";
import { TierBoard } from "@/components/tiers/tier-board";

export const metadata: Metadata = {
  title: "덱 티어리스트",
  description: "리프트바운드 현재 메타 덱 티어리스트 (S·A·B·C·Z).",
};
export const revalidate = 60;

export default function TiersPage() {
  return (
    <div>
      <PageHeading
        title="덱 티어리스트"
        description="현재 메타 예상 기준 · 덱을 누르면 공략으로 이동"
      />
      <Suspense fallback={<BoardSkeleton />}>
        <TierBoard />
      </Suspense>
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
