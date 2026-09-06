import type { Metadata } from "next";
import { PageHeading, ComingSoon } from "@/components/ui/page-heading";

export const metadata: Metadata = { title: "리포트" };

export default function ReportsListPage() {
  return (
    <div>
      <PageHeading title="리포트" description="메타 분석 · 뉴스 · 카드 리뷰" />
      <ComingSoon note="발행된 reports 목록(태그 필터, 페이지네이션). 상세 /reports/[slug]." />
    </div>
  );
}
