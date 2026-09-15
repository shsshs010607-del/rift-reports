import type { Metadata } from "next";
import { PlusSquare } from "lucide-react";
import { PriceMovers } from "@/components/trading/price-movers";
import { PriceBoard } from "@/components/trading/price-board";
import { FxNote } from "@/components/trading/fx-note";
import { NaverCafeCta } from "@/components/trading/naver-cafe-cta";
import { getTopGainers, getTopLosers, getPriceBoard } from "@/lib/prices";
import { getUsdKrw } from "@/lib/fx";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = { title: "트레이딩" };
export const revalidate = 900;

export default async function TradingPage() {
  const [fx, gainers, losers, board] = await Promise.all([
    getUsdKrw(),
    getTopGainers(5),
    getTopLosers(5),
    getPriceBoard(),
  ]);

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-headline-md text-ink">트레이딩</h1>
            <p className="mt-0.5 text-body-md text-ink-soft">이용자 간 직거래 · 실시간 시세</p>
          </div>
          <a
            href={SITE.naverCafeTradeWrite}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3.5 text-title-md font-bold text-white shadow-[0_6px_18px_rgba(70,72,212,0.28)] transition hover:bg-primary-container"
          >
            <PlusSquare className="h-5 w-5" />
            거래글 등록
          </a>
        </div>
        {/* 거래는 네이버 카페·디스코드에서: 바로가기 */}
        <NaverCafeCta />
      </header>

      {/* 시세: 좌 카드 시세 / 우 급등·급락 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
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
    </div>
  );
}
