import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { SectionHeader, EmptyState } from "@/components/ui/section-header";
import { TRADING_CATEGORIES, TRADE_CONDITIONS } from "@/lib/constants";
import { formatKRW } from "@/lib/utils";
import type { TradeListing } from "@/lib/types/database";

const catLabel = (slug: string) => TRADING_CATEGORIES.find((c) => c.slug === slug)?.label ?? slug;
const condLabel = (slug: string | null) =>
  slug ? TRADE_CONDITIONS.find((c) => c.slug === slug)?.label ?? slug : null;

const catColor: Record<string, string> = {
  sell: "bg-emerald/10 text-[#047857]",
  buy: "bg-primary-wash text-primary-strong",
  trade: "bg-amber/10 text-[#B45309]",
};

export function TradingPreview({ trades }: { trades: TradeListing[] }) {
  return (
    <section>
      <SectionHeader title="최근 카드 거래" description="팝니다 · 삽니다 · 교환" href="/trading" />
      {trades.length === 0 ? (
        <EmptyState message="등록된 거래글이 없습니다." />
      ) : (
        <ul className="divide-y divide-line/70 overflow-hidden rounded-2xl border border-line/80 bg-card shadow-e1">
          {trades.map((t) => (
            <li key={t.id}>
              <Link href={`/trading/${t.id}`} className="flex items-center gap-3 p-4 hover:bg-subcanvas/50">
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-label-sm uppercase ${catColor[t.category] ?? ""}`}
                >
                  {catLabel(t.category)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-title-md text-ink">{t.title}</p>
                  <p className="text-body-sm text-ink-soft">
                    {condLabel(t.card_condition) && <span>{condLabel(t.card_condition)} · </span>}
                    {t.region ?? "지역 미지정"} ·{" "}
                    {formatDistanceToNow(new Date(t.created_at), { addSuffix: true, locale: ko })}
                  </p>
                </div>
                <span className="shrink-0 font-display text-title-md text-ink">
                  {t.price != null ? formatKRW(t.price) : t.category === "trade" ? "교환" : "가격협의"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
