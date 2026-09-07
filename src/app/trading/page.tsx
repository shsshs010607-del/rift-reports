import type { Metadata } from "next";
import Link from "next/link";
import { PlusSquare } from "lucide-react";
import { PriceMovers } from "@/components/trading/price-movers";
import { PriceBoard } from "@/components/trading/price-board";
import { FxNote } from "@/components/trading/fx-note";
import { TradeBoard } from "@/components/trading/trade-board";
import { getTopGainers, getTopLosers, getPriceBoard } from "@/lib/prices";
import { getUsdKrw } from "@/lib/fx";
import { getListings } from "@/lib/trading";

export const metadata: Metadata = { title: "트레이딩" };
export const revalidate = 900;

export default async function TradingPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const [fx, gainers, losers, board, listings] = await Promise.all([
    getUsdKrw(),
    getTopGainers(5),
    getTopLosers(5),
    getPriceBoard(),
    getListings(),
  ]);

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-headline-md text-ink">트레이딩</h1>
          <p className="mt-0.5 text-body-md text-ink-soft">이용자 간 직거래 · 실시간 시세</p>
        </div>
        <Link
          href="/trading/new"
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-label-md font-bold text-white transition hover:bg-primary-container"
        >
          <PlusSquare className="h-4 w-4" />
          거래글 등록
        </Link>
      </header>

      {/* 시세: 좌 카드 시세 / 우 급등·급락 */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="min-w-0">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
            <h2 className="text-title-md font-bold text-ink">카드 시세</h2>
            <FxNote fx={fx} />
          </div>
          <PriceBoard rows={board} fx={fx} />
        </section>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <PriceMovers gainers={gainers} losers={losers} fx={fx} layout="stacked" />
        </aside>
      </div>

      {/* 거래글 */}
      <section id="listings" className="scroll-mt-24">
        <h2 className="mb-3 text-title-md font-bold text-ink">거래글</h2>
        <TradeBoard listings={listings} initialQuery={searchParams.q ?? ""} />
      </section>
    </div>
  );
}
