import Link from "next/link";
import Image from "next/image";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { PriceRow } from "@/lib/prices";
import type { FxRate } from "@/lib/fx";
import { PRINT_LANGUAGES } from "@/lib/constants";
import { deltaUsd, fmtKrwSigned, fmtUsdSigned } from "@/lib/money";
import { cn } from "@/lib/utils";
import { FxNote } from "@/components/trading/fx-note";

const langLabel = (s: string) => PRINT_LANGUAGES.find((l) => l.slug === s)?.label ?? s.toUpperCase();

function MoverList({
  title,
  rows,
  fx,
  up,
}: {
  title: string;
  rows: PriceRow[];
  fx: FxRate;
  up: boolean;
}) {
  return (
    <div className="surface note-card p-4">
      <h3 className="mb-3 flex items-center gap-1.5 font-display text-title-md text-ink">
        {up ? (
          <TrendingUp className="h-4 w-4 text-emerald" />
        ) : (
          <TrendingDown className="h-4 w-4 text-coral" />
        )}
        {title}
      </h3>
      {rows.length === 0 ? (
        <p className="py-4 text-center text-body-sm text-ink-soft">데이터 없음</p>
      ) : (
        <ol className="flex flex-col">
          {rows.map((r, i) => {
            const d =
              r.market_price != null && r.change_7d != null
                ? deltaUsd(r.market_price, r.change_7d)
                : null;
            return (
              <li key={r.id}>
                <Link
                  href={`/trading/cards/${r.print_id}`}
                  className="flex items-center gap-3 rounded-lg px-1.5 py-2 hover:bg-subcanvas/60"
                >
                  <span className="w-4 text-center text-label-sm text-ink-soft">{i + 1}</span>
                  <span className="relative h-9 w-7 shrink-0 overflow-hidden rounded bg-subcanvas">
                    {r.print?.image_url && (
                      <Image src={r.print.image_url} alt="" fill sizes="28px" className="object-cover" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-body-md text-ink">
                      {r.print?.ko_name || r.print?.name || "—"}
                    </span>
                    <span className="block text-body-sm text-ink-soft">
                      {r.print && `${langLabel(r.print.language)} · ${r.print.rarity ?? ""}`}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span
                      className={cn(
                        "block text-body-md font-bold",
                        (d ?? 0) >= 0 ? "text-emerald" : "text-coral",
                      )}
                    >
                      {fmtKrwSigned(d, fx.usdKrw)}
                    </span>
                    <span className="block text-body-sm text-ink-soft">{fmtUsdSigned(d)}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

export function PriceMovers({
  gainers,
  losers,
  fx,
  layout = "grid",
}: {
  gainers: PriceRow[];
  losers: PriceRow[];
  fx: FxRate;
  layout?: "grid" | "stacked";
}) {
  return (
    <section>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
        <h2 className="text-title-md font-bold text-ink">시세 변동 (7일)</h2>
        {layout === "grid" && <FxNote fx={fx} />}
      </div>
      <div className={layout === "stacked" ? "flex flex-col gap-4" : "grid gap-4 sm:grid-cols-2"}>
        <MoverList title="급등 Top 5" rows={gainers} fx={fx} up />
        <MoverList title="급락 Top 5" rows={losers} fx={fx} up={false} />
      </div>
    </section>
  );
}
