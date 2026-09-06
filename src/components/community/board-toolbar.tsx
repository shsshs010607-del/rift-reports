"use client";

import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Search, PenLine } from "lucide-react";
import { cn } from "@/lib/utils";

/** 최신 / 인기 탭 + 제목·내용 검색 + 글쓰기 버튼 */
export function BoardToolbar({ writeHref }: { writeHref: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const tab = params.get("tab") === "popular" ? "popular" : "latest";
  const [q, setQ] = useState(params.get("q") ?? "");

  function withParams(next: Record<string, string | null>) {
    const sp = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v === null || v === "") sp.delete(k);
      else sp.set(k, v);
    }
    sp.delete("page");
    return `${pathname}?${sp.toString()}`;
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    router.push(withParams({ q: q.trim() || null }));
  }

  return (
    <div className="mb-4 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div className="inline-flex rounded-full bg-primary-wash p-1">
          {(
            [
              { id: "latest", label: "최신글" },
              { id: "popular", label: "인기글" },
            ] as const
          ).map((t) => (
            <Link
              key={t.id}
              href={withParams({ tab: t.id === "latest" ? null : t.id })}
              className={cn(
                "rounded-full px-4 py-1.5 text-label-lg transition",
                tab === t.id ? "bg-card text-primary-strong shadow-e1" : "text-ink-soft hover:text-ink",
              )}
            >
              {t.label}
            </Link>
          ))}
        </div>
        <Link href={writeHref} className="btn-primary">
          <PenLine className="h-4 w-4" />
          글쓰기
        </Link>
      </div>

      <form onSubmit={submit} className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="제목·내용 검색 (최신순)"
          className="field pl-10"
        />
      </form>
    </div>
  );
}
