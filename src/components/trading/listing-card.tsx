import Link from "next/link";
import { MapPin } from "lucide-react";
import type { ListingWithSeller } from "@/lib/trading";
import { TRADING_CATEGORIES, TRADE_STATUS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const CAT = new Map(TRADING_CATEGORIES.map((c) => [c.slug, c.label]));
const STATUS = new Map(TRADE_STATUS.map((s) => [s.slug, s.label]));

const CAT_STYLE: Record<string, string> = {
  sell: "bg-primary/10 text-primary-strong",
  buy: "bg-emerald/15 text-emerald",
  trade: "bg-amber/15 text-[#B45309]",
};

export function ListingCard({ listing: l }: { listing: ListingWithSeller }) {
  const closed = l.status === "closed";
  return (
    <Link
      href={`/trading/${l.id}`}
      className={cn(
        "flex flex-col gap-2 rounded-2xl border border-line/80 bg-card p-4 transition hover:border-primary/50",
        closed && "opacity-60",
      )}
    >
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-label-sm font-bold",
            CAT_STYLE[l.category] ?? "bg-subcanvas text-ink-soft",
          )}
        >
          {CAT.get(l.category)}
        </span>
        {l.status !== "open" && (
          <span className="rounded-full bg-subcanvas px-2 py-0.5 text-label-sm text-ink-soft">
            {STATUS.get(l.status)}
          </span>
        )}
      </div>

      <p className="line-clamp-1 font-display text-title-md font-bold text-ink">{l.title}</p>
      {l.description && (
        <p className="line-clamp-2 text-body-sm text-ink-soft">{l.description}</p>
      )}

      <div className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-1 pt-1 text-body-sm text-ink-soft">
        <span className="font-bold text-ink">
          {l.price != null ? `₩${l.price.toLocaleString("ko-KR")}` : "가격 협의"}
          {l.price != null && l.is_negotiable && " (협의 가능)"}
        </span>
        {l.region && (
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {l.region}
          </span>
        )}
        <span>· {l.seller?.username ?? "알 수 없음"}</span>
      </div>
    </Link>
  );
}
