import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { ShopExplorer } from "@/components/shops/shop-explorer";
import { getShops } from "@/lib/shops";
import { getUpcomingTournaments } from "@/lib/queries";

export const metadata: Metadata = { title: "주변 매장 및 대회" };
export const revalidate = 300;

export default async function ShopsPage() {
  const [shops, tournaments] = await Promise.all([getShops(), getUpcomingTournaments(4)]);

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
        {tournaments.length === 0 ? (
          <p className="rounded-2xl border border-line/70 bg-card p-6 text-center text-body-sm text-ink-soft">
            예정된 대회가 없습니다.
          </p>
        ) : (
          <ul className="divide-y divide-line/50 overflow-hidden rounded-2xl border border-line/70 bg-card">
            {tournaments.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/tournaments/${t.slug}`}
                  className="flex items-center gap-3 p-3.5 hover:bg-subcanvas/50"
                >
                  <CalendarDays className="h-4 w-4 shrink-0 text-ink-soft" />
                  <span className="min-w-0 flex-1 truncate text-body-md text-ink">{t.name}</span>
                  <span className="shrink-0 text-body-sm text-ink-soft">
                    {t.is_online ? "온라인" : (t.location ?? "장소 미정")}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
