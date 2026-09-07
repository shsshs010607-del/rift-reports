"use client";

import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Search, PenLine, X } from "lucide-react";
import { cn } from "@/lib/utils";

/** 최신 / 인기 탭 + 검색 + 글쓰기 */
export function BoardToolbar({ writeHref }: { writeHref: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const tab = params.get("tab") === "popular" ? "popular" : "latest";
  const initialQ = params.get("q") ?? "";
  const [q, setQ] = useState(initialQ);
  const [searchOpen, setSearchOpen] = useState(Boolean(initialQ));

  function withParams(next: Record<string, string | null>) {
    const sp = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v === null || v === "") sp.delete(k);
      else sp.set(k, v);
    }
    sp.delete("page");
    const s = sp.toString();
    return s ? `${pathname}?${s}` : pathname;
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    router.push(withParams({ q: q.trim() || null }));
  }

  const TABS = [
    { id: "latest", label: "최신" },
    { id: "popular", label: "인기" },
  ] as const;

  return (
    <div className="mb-4 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2 border-b border-line/60">
        <div className="flex">
          {TABS.map((t) => (
            <Link
              key={t.id}
              href={withParams({ tab: t.id === "latest" ? null : t.id })}
              className={cn(
                "relative px-3 pb-2.5 pt-1 text-body-md font-bold transition-colors",
                tab === t.id ? "text-ink" : "text-ink-soft hover:text-ink",
              )}
            >
              {t.label}
              {tab === t.id && (
                <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-primary" />
              )}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-1.5 pb-1.5">
          <button
            type="button"
            onClick={() => setSearchOpen((v) => !v)}
            aria-label="검색"
            className={cn(
              "grid h-9 w-9 place-items-center rounded-full transition-colors",
              searchOpen ? "bg-primary/10 text-primary-strong" : "text-ink-soft hover:bg-subcanvas",
            )}
          >
            {searchOpen ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
          </button>
          <Link
            href={writeHref}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-label-md font-bold text-white transition hover:bg-primary-container"
          >
            <PenLine className="h-4 w-4" />
            글쓰기
          </Link>
        </div>
      </div>

      {searchOpen && (
        <form onSubmit={submit} className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
          <input
            type="search"
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="제목·내용 검색"
            className="w-full rounded-full border border-line bg-card py-2.5 pl-10 pr-4 text-body-md text-ink placeholder:text-ink-soft/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
          />
        </form>
      )}
    </div>
  );
}
