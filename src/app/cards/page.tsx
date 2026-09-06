import type { Metadata } from "next";
import { PageHeading, ComingSoon } from "@/components/ui/page-heading";

export const metadata: Metadata = { title: "카드 정보" };

export default function CardsPage() {
  return (
    <div>
      <PageHeading title="카드 정보 (Card DB)" description="카드 검색 · 필터(도메인/코스트/타입/레어도) · 상세" />
      <ComingSoon note="좌측 필터 사이드바 + 카드 그리드(5:7 비율, 레어도 테두리) + /cards/[id] 또는 인터셉트 라우트 모달. 데이터: cards 테이블." />
    </div>
  );
}
