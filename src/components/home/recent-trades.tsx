import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { getListings } from "@/lib/trading";
import { TRADING_CATEGORIES } from "@/lib/constants";
import { fmtKstRelative } from "@/lib/datetime";

const CAT = new Map<string, string>(TRADING_CATEGORIES.map((c) => [c.slug, c.label]));

/** 홈 — 최근 올라온 거래글. */
export async function RecentTrades() {
  const items = (await getListings({ status: "open" })).slice(0, 4);
  if (items.length === 0) return null;

  return (
    <section>
      <div className="mb-3 flex items-end justify-between">
        <h2 className="section-title">최근 거래글</h2>
        <Link
          href="/trading"
          className="inline-flex items-center gap-1 text-label-md font-bold text-primary-strong hover:underline"
        >
          트레이딩 <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <ul className="grid gap-2.5 sm:grid-cols-2">
        {items.map((l) => (
          <li key={l.id}>
            <Link
              href={`/trading/${l.id}`}
              className="flex items-center gap-2.5 rounded-xl border border-line/70 bg-card p-3 transition hover:border-primary/40"
            >
              <span className="chip shrink-0">{CAT.get(l.category)}</span>
              <span className="min-w-0 flex-1 truncate text-body-md text-ink">{l.title}</span>
              <span className="shrink-0 text-label-sm font-bold text-ink">
                {l.price != null ? `₩${l.price.toLocaleString("ko-KR")}` : "협의"}
              </span>
              <time className="hidden shrink-0 text-label-sm text-ink-soft sm:block">
                {fmtKstRelative(l.created_at)}
              </time>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
