import type { Metadata } from "next";
import Link from "next/link";
import { PageHeading, ComingSoon } from "@/components/ui/page-heading";
import { PriceMovers } from "@/components/trading/price-movers";
import { getTopGainers, getTopLosers } from "@/lib/prices";
import { TRADING_CATEGORIES } from "@/lib/constants";

export const metadata: Metadata = { title: "카드 거래" };
export const revalidate = 900; // 15분 (시세 6시간 갱신이라 충분)

export default async function TradingPage() {
  const [gainers, losers] = await Promise.all([getTopGainers(5), getTopLosers(5)]);

  return (
    <div className="flex flex-col gap-10">
      <div>
        <PageHeading title="카드 거래" description="시세 확인 후 거래 사이트 또는 커뮤니티 거래글로" />
        <div className="flex flex-wrap gap-2">
          {TRADING_CATEGORIES.map((c) => (
            <span key={c.slug} className="btn-ghost">
              {c.label}
            </span>
          ))}
          <Link href="/trading/new" className="btn-primary">
            거래글 등록
          </Link>
        </div>
      </div>

      <PriceMovers gainers={gainers} losers={losers} />

      <section>
        <h2 className="section-title mb-3">거래글</h2>
        <ComingSoon note="trade_listings 리스트/필터(카테고리·상태·지역), 상태 뱃지, 가격. 상세 /trading/[id]. 카드별 거래글은 /trading?print=<id>." />
      </section>
    </div>
  );
}
