import Link from "next/link";
import Image from "next/image";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { PriceRow } from "@/lib/prices";
import { PRINT_LANGUAGES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const langLabel = (s: string) => PRINT_LANGUAGES.find((l) => l.slug === s)?.label ?? s.toUpperCase();

function MoverList({ title, rows, up }: { title: string; rows: PriceRow[]; up: boolean }) {
  return (
    <div className="surface p-4">
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
          {rows.map((r, i) => (
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
                  <span className="block truncate text-body-md text-ink">{r.print?.name ?? "—"}</span>
                  <span className="block text-body-sm text-ink-soft">
                    {r.print && `${langLabel(r.print.language)} · ${r.print.rarity ?? ""}`}
                  </span>
                </span>
                <span className="text-right">
                  <span className="block text-body-md text-ink">
                    {r.market_price != null ? `$${r.market_price}` : "—"}
                  </span>
                  <span
                    className={cn(
                      "block text-body-sm font-semibold",
                      (r.change_7d ?? 0) >= 0 ? "text-emerald" : "text-coral",
                    )}
                  >
                    {r.change_7d != null ? `${r.change_7d > 0 ? "+" : ""}${r.change_7d}%` : ""}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export function PriceMovers({ gainers, losers }: { gainers: PriceRow[]; losers: PriceRow[] }) {
  return (
    <section>
      <div className="mb-3 flex items-end justify-between">
        <h2 className="section-title">시세 (7일)</h2>
        <span className="text-body-sm text-ink-soft">JustTCG · USD · 8시간마다 갱신</span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <MoverList title="급등 Top 5" rows={gainers} up />
        <MoverList title="급락 Top 5" rows={losers} up={false} />
      </div>
    </section>
  );
}
