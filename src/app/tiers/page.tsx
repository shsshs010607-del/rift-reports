import { Suspense } from "react";
import type { Metadata } from "next";

import { PageHeading } from "@/components/ui/page-heading";
import { TierBoard } from "@/components/tiers/tier-board";
import { DeckQuiz } from "@/components/tiers/deck-quiz";
import { getCardService } from "@/lib/services/cardService";
import { TIER_DECKS } from "@/lib/data/tier-list";

export const metadata: Metadata = {
  title: "덱 티어리스트",
  description: "리프트바운드 현재 메타 덱 티어리스트 (S·A·B·C·Z).",
};
// DeckQuiz 가 useSearchParams(?quiz) 로 자동 오픈하므로 동적 렌더.
export const dynamic = "force-dynamic";

async function legendImages(): Promise<Record<string, string>> {
  try {
    const legends = await getCardService().searchCards({ type: "legend" });
    const byName = new Map(legends.map((c) => [c.localization.en.name, c]));
    const out: Record<string, string> = {};
    for (const d of TIER_DECKS) {
      const art = byName.get(d.legendEn)?.localization.en.imageUrl ?? byName.get(d.legendEn)?.imageUrl;
      if (art) out[d.id] = art;
    }
    return out;
  } catch {
    return {};
  }
}

export default async function TiersPage() {
  const images = await legendImages();

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <PageHeading
          title="덱 티어리스트"
          description="현재 메타 예상 기준 · 덱을 누르면 공략으로 이동"
        />
        <Suspense fallback={null}>
          <DeckQuiz images={images} />
        </Suspense>
      </div>
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
