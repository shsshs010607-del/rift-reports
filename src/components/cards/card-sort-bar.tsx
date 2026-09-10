"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowDown, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

export type CardSortKey = "number" | "cost" | "name" | "power";

const SORTS: { key: CardSortKey; label: string }[] = [
  { key: "number", label: "수집번호" },
  { key: "cost", label: "코스트" },
  { key: "power", label: "위력" },
  { key: "name", label: "이름" },
];

/** 카드 목록 정렬 — 기준 버튼 + 오름/내림차순 토글. URL ?sort=&dir= 로 반영. */
export function CardSortBar() {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, start] = useTransition();

  const sort = (params.get("sort") as CardSortKey) || "number";
  const dir = params.get("dir") === "desc" ? "desc" : "asc";

  const push = (nextSort: CardSortKey, nextDir: "asc" | "desc") => {
    const next = new URLSearchParams(params.toString());
    next.delete("page");
    if (nextSort === "number") next.delete("sort");
    else next.set("sort", nextSort);
    if (nextDir === "asc") next.delete("dir");
    else next.set("dir", nextDir);
    const qs = next.toString();
    start(() => router.push(qs ? `/cards?${qs}` : "/cards", { scroll: false }));
  };

  return (
    <div
      aria-busy={pending}
      className={cn(
        "mb-3 flex flex-wrap items-center gap-1 text-label-sm transition-opacity",
        pending && "opacity-60",
      )}
    >
      <span className="mr-0.5 text-ink-soft">정렬</span>
      {SORTS.map((s) => (
        <button
          key={s.key}
          type="button"
          onClick={() => push(s.key, dir)}
          className={cn(
            "rounded-lg px-2 py-1 font-semibold transition",
            sort === s.key
              ? "bg-primary text-white"
              : "text-ink-soft hover:bg-subcanvas hover:text-ink",
          )}
        >
          {s.label}
        </button>
      ))}
      <button
        type="button"
        onClick={() => push(sort, dir === "asc" ? "desc" : "asc")}
        aria-label={dir === "asc" ? "오름차순" : "내림차순"}
        className="inline-flex items-center gap-1 rounded-lg border border-line px-2 py-1 font-semibold text-ink-soft transition hover:bg-subcanvas hover:text-ink"
      >
        {dir === "asc" ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />}
        {dir === "asc" ? "오름차순" : "내림차순"}
      </button>
    </div>
  );
}
