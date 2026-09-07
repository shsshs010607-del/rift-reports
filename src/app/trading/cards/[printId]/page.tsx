import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { ExternalLink, MessagesSquare, AlertTriangle } from "lucide-react";
import { getPrintWithPrice, getPrintVariants, getPrintGroup, isStale } from "@/lib/prices";
import { getUsdKrw } from "@/lib/fx";
import { fmtKrw, fmtUsd } from "@/lib/money";
import { PRINT_LANGUAGES, CARD_CONDITIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { PriceSparkline } from "@/components/trading/price-sparkline";
import { FxNote } from "@/components/trading/fx-note";

export const revalidate = 900;

const langLabel = (s: string) => PRINT_LANGUAGES.find((l) => l.slug === s)?.label ?? s.toUpperCase();
const condLabel = (s: string) => CARD_CONDITIONS.find((c) => c.slug === s)?.label ?? s;
const pct = (n: number | null | undefined) => (n == null ? "" : `${n > 0 ? "+" : ""}${n}%`);

export default async function PrintPricePage({ params }: { params: { printId: string } }) {
  const res = await getPrintWithPrice(params.printId);
  if (!res) notFound();
  const { print, price } = res;

  const [fx, variants, group] = await Promise.all([
    getUsdKrw(),
    getPrintVariants(print.id),
    getPrintGroup(print.group_id),
  ]);
  const money = (n: number | null | undefined) => fmtKrw(n, fx.usdKrw);
  const stale = price && isStale(price.captured_at);
  const history = (price?.history ?? []).map((h) => ({ t: new Date(h.t * 1000).toISOString(), v: h.p }));

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex gap-5">
        <div className="relative aspect-[5/7] w-40 shrink-0 overflow-hidden rounded-xl bg-subcanvas shadow-e1">
          {print.image_url && (
            <Image src={print.image_url} alt={print.name} fill sizes="160px" className="object-cover" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-headline-md text-ink">{print.name}</h1>
          <p className="mt-1 flex flex-wrap gap-1.5">
            <span className="chip">{langLabel(print.language)}</span>
            {print.rarity && <span className="chip">{print.rarity}</span>}
            {print.set_code && (
              <span className="chip">
                {print.set_code} {print.number}
              </span>
            )}
          </p>

          {price ? (
            <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2">
              <Stat
                label="최근 시세"
                value={money(price.market_price)}
                sub={fmtUsd(price.market_price)}
                big
              />
              <Stat
                label="7일 변동"
                value={pct(price.change_7d) || "—"}
                tone={(price.change_7d ?? 0) >= 0 ? "up" : "down"}
              />
              <Stat
                label="30일 평균"
                value={money(price.avg_price_30d)}
                sub={fmtUsd(price.avg_price_30d)}
              />
              <Stat
                label="90일 최저 / 최고"
                value={`${money(price.min_price_90d)} / ${money(price.max_price_90d)}`}
                sub={`${fmtUsd(price.min_price_90d)} / ${fmtUsd(price.max_price_90d)}`}
              />
            </dl>
          ) : (
            <p className="mt-4 text-body-md text-ink-soft">아직 시세 데이터가 없습니다.</p>
          )}

          {stale && price && (
            <p className="mt-2 flex items-center gap-1.5 text-body-sm text-[#B45309]">
              <AlertTriangle className="h-3.5 w-3.5" />
              {formatDistanceToNow(new Date(price.captured_at), { addSuffix: true, locale: ko })} 갱신
            </p>
          )}
          <p className="mt-1 text-body-sm text-ink-soft">
            블렌디드 시세 · 매수/매도 호가는 제공되지 않음
          </p>
          <p className="mt-0.5">
            <FxNote fx={fx} />
          </p>
        </div>
      </div>

      {history.length > 1 && (
        <div className="surface mt-6 p-4">
          <p className="mb-2 text-label-lg text-ink">시세 추이</p>
          <PriceSparkline points={history} />
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        {print.tcgplayer_url && (
          <a href={print.tcgplayer_url} target="_blank" rel="noopener noreferrer" className="btn-primary">
            <ExternalLink className="h-4 w-4" />
            TCGplayer 에서 거래
          </a>
        )}
        <Link href={`/trading?print=${print.id}`} className="btn-ghost">
          <MessagesSquare className="h-4 w-4" />
          커뮤니티 거래글
        </Link>
      </div>

      {variants.length > 1 && (
        <section className="mt-8">
          <h2 className="section-title mb-3">상태·포일별 시세</h2>
          <ul className="divide-y divide-line/70 overflow-hidden rounded-2xl border border-line/80 bg-card">
            {variants.map((v) => (
              <li key={v.id} className="flex items-center justify-between p-3">
                <span className="text-body-md text-ink">
                  {condLabel(v.condition)}
                  {v.printing === "foil" && " · 포일"}
                </span>
                <span className="flex items-center gap-3">
                  <span className="text-right">
                    <span className="block text-body-md text-ink">{money(v.market_price)}</span>
                    <span className="block text-label-sm text-ink-soft">{fmtUsd(v.market_price)}</span>
                  </span>
                  {v.change_7d != null && (
                    <span
                      className={cn(
                        "text-body-sm font-semibold",
                        v.change_7d >= 0 ? "text-emerald" : "text-coral",
                      )}
                    >
                      {pct(v.change_7d)}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {group.length > 1 && (
        <section className="mt-10">
          <h2 className="section-title mb-3">다른 버전 (언어 · 일러스트)</h2>
          <ul className="divide-y divide-line/70 overflow-hidden rounded-2xl border border-line/80 bg-card">
            {group.map(({ print: g, price: gp }) => (
              <li key={g.id}>
                <Link
                  href={`/trading/cards/${g.id}`}
                  className={cn(
                    "flex items-center gap-3 p-3 hover:bg-subcanvas/50",
                    g.id === print.id && "bg-primary-wash/50",
                  )}
                >
                  <span className="relative h-10 w-8 shrink-0 overflow-hidden rounded bg-subcanvas">
                    {g.image_url && <Image src={g.image_url} alt="" fill sizes="32px" className="object-cover" />}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-body-md text-ink">
                    {g.name} <span className="text-ink-soft">· {langLabel(g.language)}</span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-body-md text-ink">{money(gp?.market_price)}</span>
                    <span className="block text-label-sm text-ink-soft">{fmtUsd(gp?.market_price)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  big,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  big?: boolean;
  tone?: "up" | "down";
}) {
  return (
    <div>
      <dt className="text-body-sm text-ink-soft">{label}</dt>
      <dd
        className={cn(
          "font-display text-ink",
          big ? "text-headline-sm" : "text-title-md",
          tone === "up" && "text-emerald",
          tone === "down" && "text-coral",
        )}
      >
        {value}
      </dd>
      {sub && <dd className="text-label-sm text-ink-soft">{sub}</dd>}
    </div>
  );
}
