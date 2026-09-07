"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Search, X } from "lucide-react";

export function CardSearchBox({ initial = "" }: { initial?: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const [value, setValue] = useState(initial);

  const go = (q: string) => {
    const next = new URLSearchParams(params.toString());
    next.delete("page");
    if (q) next.set("q", q);
    else next.delete("q");
    const qs = next.toString();
    router.push(qs ? `/cards?${qs}` : "/cards", { scroll: false });
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        go(value.trim());
      }}
      className="group relative"
    >
      <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-soft transition group-focus-within:text-primary" />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="카드명 · 효과 · 용어 검색 (예: 아리, Ganking, 소환)"
        className="w-full rounded-2xl border-2 border-line bg-card py-4 pl-14 pr-32 text-body-lg text-ink shadow-e1 outline-none transition placeholder:text-ink-soft/60 focus:border-primary focus:shadow-e2 focus:ring-4 focus:ring-primary/10"
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            setValue("");
            go("");
          }}
          className="absolute right-[92px] top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-ink-soft transition hover:bg-subcanvas hover:text-ink"
          aria-label="지우기"
        >
          <X className="h-4 w-4" />
        </button>
      )}
      <button
        type="submit"
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-primary px-5 py-2.5 text-label-lg font-bold text-white shadow-[0_4px_14px_rgba(70,72,212,0.3)] transition hover:bg-primary-container"
      >
        검색
      </button>
    </form>
  );
}
