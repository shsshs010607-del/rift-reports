"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";

export function CardSearchBox({ initial = "" }: { initial?: string }) {
  const router = useRouter();
  const [value, setValue] = useState(initial);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const q = value.trim();
    router.push(q ? `/cards?q=${encodeURIComponent(q)}` : "/cards");
  }

  return (
    <form onSubmit={submit} className="relative">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="카드명 또는 효과 검색 — 용어도 가능 (예: 아리 / Ganking / 소환)"
        className="field pl-10"
      />
    </form>
  );
}
