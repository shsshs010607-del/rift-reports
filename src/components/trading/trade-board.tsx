"use client";

import { useMemo, useState } from "react";
import type { ListingWithSeller } from "@/lib/trading";
import { TRADING_CATEGORIES, KR_SIDO } from "@/lib/constants";
import { ListingCard } from "@/components/trading/listing-card";
import { cn } from "@/lib/utils";

export function TradeBoard({ listings }: { listings: ListingWithSeller[] }) {
  const [cat, setCat] = useState<string>("");
  const [region, setRegion] = useState<string>("");
  const [hideClosed, setHideClosed] = useState(true);

  const view = useMemo(
    () =>
      listings.filter((l) => {
        if (cat && l.category !== cat) return false;
        if (region && l.region !== region) return false;
        if (hideClosed && l.status === "closed") return false;
        return true;
      }),
    [listings, cat, region, hideClosed],
  );

  if (listings.length === 0) {
    return (
      <p className="rounded-2xl border border-line bg-card p-10 text-center text-body-md text-ink-soft">
        아직 등록된 거래글이 없습니다. 첫 거래글을 올려보세요.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <Chip on={cat === ""} onClick={() => setCat("")}>
          전체
        </Chip>
        {TRADING_CATEGORIES.map((c) => (
          <Chip key={c.slug} on={cat === c.slug} onClick={() => setCat(cat === c.slug ? "" : c.slug)}>
            {c.label}
          </Chip>
        ))}
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="ml-1 rounded-full border border-line bg-card px-3 py-1 text-label-sm text-ink"
        >
          <option value="">전 지역</option>
          {KR_SIDO.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <label className="ml-auto flex items-center gap-1.5 text-label-sm text-ink-soft">
          <input
            type="checkbox"
            checked={hideClosed}
            onChange={(e) => setHideClosed(e.target.checked)}
            className="h-3.5 w-3.5"
          />
          완료 숨기기
        </label>
      </div>

      {view.length === 0 ? (
        <p className="py-8 text-center text-body-sm text-ink-soft">조건에 맞는 거래글이 없습니다.</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {view.map((l) => (
            <li key={l.id}>
              <ListingCard listing={l} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Chip({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-label-sm font-bold transition",
        on
          ? "border-primary bg-primary/10 text-primary-strong"
          : "border-line text-ink-soft hover:border-primary/40",
      )}
    >
      {children}
    </button>
  );
}
