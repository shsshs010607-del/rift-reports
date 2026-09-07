import type { Metadata } from "next";
import Link from "next/link";
import { ShopExplorer } from "@/components/shops/shop-explorer";
import { TournamentCalendar } from "@/components/shops/tournament-calendar";
import { getShops } from "@/lib/shops";
import { getUpcomingTournaments } from "@/lib/queries";

export const metadata: Metadata = { title: "주변 매장 및 대회" };
export const revalidate = 300;

export default async function ShopsPage() {
  const [shops, tournaments] = await Promise.all([getShops(), getUpcomingTournaments(60)]);

  return (
    <div>
      <header className="mb-6">
        <h1 className="font-display text-headline-md text-ink">주변 매장 및 대회</h1>
        <p className="mt-0.5 text-body-md text-ink-soft">
          지역별 리프트바운드 카드샵 · 공인샵 · 대회 일정
        </p>
      </header>

      <ShopExplorer shops={shops} />

      <section className="mt-10">
        <div className="mb-3 flex items-end justify-between">
          <h2 className="text-title-md font-bold text-ink">다가오는 대회</h2>
          <Link href="/tournaments" className="text-body-sm text-ink-soft hover:text-primary-strong">
            전체 보기
          </Link>
        </div>
        <TournamentCalendar tournaments={tournaments} />
      </section>
    </div>
  );
}
