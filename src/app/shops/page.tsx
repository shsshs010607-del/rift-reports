import type { Metadata } from "next";

import { PageHeading } from "@/components/ui/page-heading";
import { ShopExplorer } from "@/components/shops/shop-explorer";

export const metadata: Metadata = { title: "주변 매장 및 대회" };

/**
 * 카드샵 검색 + 매장 대회.
 * DB 스키마·API·UI 설계는 docs/shops-and-events.md 참고. 현재는 UI 셸 + 빈 상태.
 */
export default function ShopsPage() {
  return (
    <div>
      <PageHeading
        title="주변 매장 및 대회"
        description="지역별 리프트바운드 카드샵 검색 · 공인샵 · 매장 대회 일정"
      />
      <ShopExplorer />

      <section className="mt-8 rounded-2xl border border-line bg-card p-5">
        <h2 className="font-display text-title-md font-bold text-ink">매장 대회 일정</h2>
        <p className="mt-1 text-body-sm text-ink-soft">
          매장을 선택하면 그 매장의 대회(접수 중 · 진행 중 · 종료)가 여기 표시됩니다. 대회 데이터
          연동 준비 중입니다.
        </p>
      </section>
    </div>
  );
}
