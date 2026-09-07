import type { Metadata } from "next";
import Link from "next/link";
import { PlusSquare } from "lucide-react";
import { PageHeading } from "@/components/ui/page-heading";
import { PriceMovers } from "@/components/trading/price-movers";
import { PriceBoard } from "@/components/trading/price-board";
import { FxNote } from "@/components/trading/fx-note";
import { TradeBoard } from "@/components/trading/trade-board";
import { getTopGainers, getTopLosers, getPriceBoard } from "@/lib/prices";
import { getUsdKrw } from "@/lib/fx";
import { getListings } from "@/lib/trading";

export const metadata: Metadata = { title: "카드 거래" };
export const revalidate = 900; // 15분 (시세 6시간 갱신이라 충분)

export default async function TradingPage() {
  const [fx, gainers, losers, board, listings] = await Promise.all([
    getUsdKrw(),
    getTopGainers(5),
    getTopLosers(5),
    getPriceBoard(),
    getListings(),
  ]);

  return (
    <div className="flex flex-col gap-10">
      <PageHeading title="카드 거래" description="시세 확인 후 이용자 간 직거래" />

      <PriceMovers gainers={gainers} losers={losers} fx={fx} />

      <section>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
          <h2 className="section-title">카드 시세</h2>
          <FxNote fx={fx} />
        </div>
        <PriceBoard rows={board} fx={fx} />
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between">
          <h2 className="section-title">거래글</h2>
          <Link href="/trading/new" className="btn-primary !py-2 !text-label-md">
            <PlusSquare className="h-4 w-4" />
            거래글 등록
          </Link>
        </div>
        <TradeBoard listings={listings} />
      </section>
    </div>
  );
}
