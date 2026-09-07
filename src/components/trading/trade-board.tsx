"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { ListingWithSeller } from "@/lib/trading";
import { TRADING_CATEGORIES, KR_SIDO } from "@/lib/constants";
import { ListingCard } from "@/components/trading/listing-card";
import { cn } from "@/lib/utils";

export function TradeBoard({ listings }: { listings: ListingWithSeller[] }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("");
  const [region, setRegion] = useState<string>("");
  const [hideClosed, setHideClosed] = useState(true);

  const view = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return listings.filter((l) => {
      if (cat && l.category !== cat) return false;
      if (region && l.region !== region) return false;
      if (hideClosed && l.status === "closed") return false;
      if (needle) {
        const hay = `${l.title} ${l.description ?? ""} ${l.seller?.username ?? ""}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [listings, q, cat, region, hideClosed]);

  if (listings.length === 0) {
    return (
      <p className="rounded-2xl border border-line/70 bg-card p-10 text-center text-body-md text-ink-soft">
        아직 등록된 거래글이 없습니다. 첫 거래글을 올려보세요.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="카드명 · 판매자 · 내용 검색"
          className="w-full rounded-full border border-line bg-card py-2.5 pl-10 pr-4 text-body-md text-ink placeholder:text-ink-soft/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
        />
      </div>

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
