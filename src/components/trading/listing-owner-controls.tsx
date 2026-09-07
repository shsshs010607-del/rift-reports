"use client";

import { useTransition } from "react";
import { setListingStatus, deleteListing } from "@/lib/actions/trading";
import { TRADE_STATUS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function ListingOwnerControls({
  id,
  status,
}: {
  id: string;
  status: string;
}) {
  const [pending, start] = useTransition();

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-line/80 bg-subcanvas/40 p-3">
      <span className="text-body-sm font-bold text-ink-soft">내 거래글</span>
      <div className="flex gap-1">
        {TRADE_STATUS.map((s) => (
          <button
            key={s.slug}
            type="button"
            disabled={pending || status === s.slug}
            onClick={() => start(() => setListingStatus(id, s.slug))}
            className={cn(
              "rounded-lg px-2.5 py-1 text-label-sm font-bold transition",
              status === s.slug
                ? "bg-primary text-white"
                : "text-ink-soft hover:bg-card hover:text-ink",
            )}
          >
            {s.label}
          </button>
        ))}
      </div>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (confirm("이 거래글을 삭제할까요?")) start(() => deleteListing(id));
        }}
        className="ml-auto text-label-sm font-bold text-coral hover:underline"
      >
        삭제
      </button>
    </div>
  );
}
