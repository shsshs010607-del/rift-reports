import Link from "next/link";
import Image from "next/image";
import { TrendingUp, TrendingDown } from "lucide-react";

import { getTopGainers, getTopLosers } from "@/lib/prices";
import { getUsdKrw } from "@/lib/fx";
import type { PriceRow } from "@/lib/prices";
import { deltaUsd, fmtKrwSigned } from "@/lib/money";
import { cn } from "@/lib/utils";

/** 홈 우측 — 시세 변동 압축 패널. */
export async function HomePriceMini() {
  const [gainers, losers, fx] = await Promise.all([
    getTopGainers(3),
    getTopLosers(3),
    getUsdKrw(),
  ]);

  return (
    <div className="note-card p-4 pr-6">
      <div className="mb-2.5 flex items-center justify-between">
        <h3 className="text-label-lg font-bold text-ink">시세 변동 (7일)</h3>
        <Link href="/trading" className="text-label-sm text-ink-soft hover:text-primary-strong">
          시세표
        </Link>
      </div>

      {gainers.length === 0 && losers.length === 0 ? (
        <p className="py-6 text-center text-body-sm text-ink-soft">시세 데이터 준비 중입니다.</p>
      ) : (
        <div className="flex flex-col gap-3">
          <Group rows={gainers} up label="급등" fxKrw={fx.usdKrw} />
          <Group rows={losers} up={false} label="급락" fxKrw={fx.usdKrw} />
          <p className="text-[11px] text-ink-soft/70">
            1 USD ≈ ₩{fx.usdKrw.toLocaleString("ko-KR")}
          </p>
        </div>
      )}
    </div>
  );
}

function Group({
  rows,
  up,
  label,
  fxKrw,
}: {
  rows: PriceRow[];
  up: boolean;
  label: string;
  fxKrw: number;
}) {
  if (rows.length === 0) return null;
  return (
    <div>
      <p
        className={cn(
          "mb-1 flex items-center gap-1 text-label-sm font-bold",
          up ? "text-emerald" : "text-coral",
        )}
      >
        {up ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
        {label}
      </p>
      <ul className="flex flex-col">
        {rows.map((r) => {
          const d =
            r.market_price != null && r.change_7d != null
              ? deltaUsd(r.market_price, r.change_7d)
              : null;
          return (
            <li key={r.id}>
              <Link
                href={`/trading/cards/${r.print_id}`}
                className="flex items-center gap-2 rounded-lg px-1 py-1.5 hover:bg-subcanvas/60"
              >
                <span className="relative h-7 w-5 shrink-0 overflow-hidden rounded bg-subcanvas">
                  {r.print?.image_url && (
                    <Image src={r.print.image_url} alt="" fill sizes="20px" className="object-cover" />
                  )}
                </span>
                <span className="min-w-0 flex-1 truncate text-body-sm text-ink">
                  {r.print?.ko_name || r.print?.name || "—"}
                </span>
                <span
                  className={cn(
                    "shrink-0 text-body-sm font-bold",
                    (d ?? 0) >= 0 ? "text-emerald" : "text-coral",
                  )}
                >
                  {fmtKrwSigned(d, fxKrw)}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
