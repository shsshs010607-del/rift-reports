import type { Metadata } from "next";
import { PageHeading, ComingSoon } from "@/components/ui/page-heading";

export const metadata: Metadata = { title: "덱 티어리스트" };

export default function TiersPage() {
  return (
    <div>
      <PageHeading
        title="덱 티어리스트"
        description="티어별 덱 목록 · 대표 챔피언 아이콘 · 상세 덱리스트"
      />
      <ComingSoon note="티어 보드(S/A/B/C 행), 덱 카드, /tiers/[slug] 상세 덱리스트 페이지가 이 자리에 들어갑니다. 데이터: decks / deck_cards 테이블." />
    </div>
  );
}
