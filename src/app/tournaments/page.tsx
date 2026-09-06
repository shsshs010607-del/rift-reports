import type { Metadata } from "next";
import { PageHeading, ComingSoon } from "@/components/ui/page-heading";

export const metadata: Metadata = { title: "대회 정보" };

export default function TournamentsPage() {
  return (
    <div>
      <PageHeading title="대회 정보" description="진행 예정 · 진행 중 · 종료" />
      <ComingSoon note="상태별 탭 + 카드 뷰(배너, 날짜, 장소, 포맷), 상세 /tournaments/[slug]. 데이터: tournaments." />
    </div>
  );
}
