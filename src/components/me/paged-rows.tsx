"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

/** /me 목록을 페이지 번호로 나눠 보여준다. */
export function PagedRows({
  items,
  perPage = 5,
}: {
  items: React.ReactNode[];
  perPage?: number;
}) {
  const [page, setPage] = useState(1);
  const pages = Math.max(1, Math.ceil(items.length / perPage));
  const p = Math.min(page, pages);
  const slice = items.slice((p - 1) * perPage, p * perPage);

  return (
    <div>
      <ul className="divide-y divide-line/60 overflow-hidden rounded-2xl border border-line/70 bg-card">
        {slice}
      </ul>

      {pages > 1 && (
        <div className="mt-3 flex flex-wrap items-center justify-center gap-1">
          {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setPage(n)}
              aria-current={n === p ? "page" : undefined}
              className={cn(
                "grid h-8 min-w-8 place-items-center rounded-lg px-2 text-label-md font-bold transition",
                n === p
                  ? "bg-primary text-white"
                  : "bg-subcanvas text-ink-soft hover:text-ink",
              )}
            >
              {n}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
