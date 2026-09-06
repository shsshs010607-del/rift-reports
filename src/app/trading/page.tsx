import type { Metadata } from "next";
import Link from "next/link";
import { PageHeading, ComingSoon } from "@/components/ui/page-heading";
import { TRADING_CATEGORIES } from "@/lib/constants";

export const metadata: Metadata = { title: "카드 거래" };

export default function TradingPage() {
  return (
    <div>
      <PageHeading title="카드 거래 게시판" description="팝니다 · 삽니다 · 교환" />
      <div className="mb-6 flex flex-wrap gap-2">
        {TRADING_CATEGORIES.map((c) => (
          <span key={c.slug} className="btn-ghost">
            {c.label}
          </span>
        ))}
        <Link href="/trading/new" className="btn-primary">
          거래글 등록
        </Link>
      </div>
      <ComingSoon note="거래글 리스트/그리드(카테고리·상태·지역 필터), 상태 뱃지(진행/예약/완료), 가격. 상세 /trading/[id]. 데이터: trade_listings." />
    </div>
  );
}
