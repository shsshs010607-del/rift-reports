import type { Metadata } from "next";
import { Suspense } from "react";

import { PageHeading } from "@/components/ui/page-heading";
import { TierBoard } from "@/components/tiers/tier-board";

export const metadata: Metadata = { title: "덱 티어리스트" };

export default function TiersPage() {
  return (
    <div>
      <PageHeading
        title="덱 티어리스트"
        description="티어별 덱 · 대표 레전드 · 덱을 누르면 공략 게시판으로 이동"
      />
      <Suspense
        fallback={
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-56 animate-pulse rounded-2xl bg-subcanvas/50" />
            ))}
          </div>
        }
      >
        <TierBoard />
      </Suspense>
    </div>
  );
}
