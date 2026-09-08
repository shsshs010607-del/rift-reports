"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

/** 홈 히어로 우측 — 카드 DB 빠른 검색. */
export function HomeCardSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const term = q.trim();
    router.push(term ? `/cards?q=${encodeURIComponent(term)}` : "/cards");
  }

  return (
    <form onSubmit={submit} className="w-full">
      <label className="mb-1.5 block text-label-sm font-bold uppercase tracking-wide text-primary-strong">
        카드 검색
      </label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="카드명 · 효과 · 용어"
          className="w-full rounded-2xl border-2 border-primary-fixed bg-card py-3 pl-10 pr-20 text-body-md text-ink shadow-e1 placeholder:text-ink-soft/70 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15"
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-primary px-3.5 py-1.5 text-label-sm font-bold text-white transition hover:bg-primary-container"
        >
          검색
        </button>
      </div>
    </form>
  );
}
