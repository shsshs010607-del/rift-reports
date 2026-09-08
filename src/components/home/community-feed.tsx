"use client";

import { useState } from "react";
import Link from "next/link";
import { MessageSquare, PenSquare, ArrowRight } from "lucide-react";

import type { PostListItem } from "@/lib/community";
import { fmtKstRelative } from "@/lib/datetime";
import { CategoryBadge } from "@/components/community/category-meta";
import { cn } from "@/lib/utils";

const isFresh = (iso: string) => Date.now() - new Date(iso).getTime() < 1000 * 60 * 60 * 6;

export function CommunityFeed({
  latest,
  popular,
}: {
  latest: PostListItem[];
  popular: PostListItem[];
}) {
  const [tab, setTab] = useState<"latest" | "popular">("latest");
  const list = (tab === "latest" ? latest : popular).slice(0, 12);

  return (
    <section className="note-card flex flex-col p-4 pr-6 sm:p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-1.5 font-display text-title-md font-bold text-ink">
          <MessageSquare className="h-4 w-4 text-primary" />
          커뮤니티
        </h2>
        <div className="flex items-center gap-1.5">
          <div className="flex rounded-lg bg-subcanvas p-0.5 text-label-sm font-bold">
            {(["latest", "popular"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={cn(
                  "rounded-md px-2.5 py-1 transition",
                  tab === t ? "bg-card text-ink shadow-sm" : "text-ink-soft hover:text-ink",
                )}
              >
                {t === "latest" ? "최신" : "인기"}
              </button>
            ))}
          </div>
          <Link
            href="/community/new"
            className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-label-sm font-bold text-white transition hover:bg-primary-container"
          >
            <PenSquare className="h-3.5 w-3.5" />
            글쓰기
          </Link>
          <Link
            href="/community"
            className="inline-flex items-center gap-0.5 text-label-sm font-bold text-ink-soft hover:text-primary-strong"
          >
            전체 <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="grid flex-1 place-items-center py-12 text-center">
          <p className="text-body-sm text-ink-soft">
            {tab === "popular" ? (
              "아직 추천받은 글이 없습니다."
            ) : (
              <>
                아직 글이 없습니다.{" "}
                <Link href="/community/new" className="font-bold text-primary-strong">
                  첫 글 쓰기 →
                </Link>
              </>
            )}
          </p>
        </div>
      ) : (
        <ul className="flex flex-1 flex-col divide-y divide-line/40">
          {list.map((p) => (
            <li key={p.id}>
              <Link
                href={`/community/post/${p.id}`}
                className="flex items-center gap-2 py-2 transition-colors hover:text-primary-strong"
              >
                {p.is_notice ? (
                  <span className="shrink-0 rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold text-white">
                    공지
                  </span>
                ) : (
                  <CategoryBadge slug={p.category} className="shrink-0" />
                )}
                <span
                  className={cn(
                    "min-w-0 flex-1 truncate text-body-md",
                    p.is_notice ? "font-bold text-primary-strong" : "text-ink",
                  )}
                >
                  {p.title}
                </span>
                {p.comment_count > 0 && (
                  <span className="inline-flex shrink-0 items-center gap-0.5 text-[12px] font-bold text-primary-strong">
                    <MessageSquare className="h-3 w-3" />
                    {p.comment_count}
                  </span>
                )}
                {!p.is_notice && isFresh(p.created_at) && (
                  <span className="shrink-0 rounded bg-coral/15 px-1 text-[10px] font-bold text-coral">
                    NEW
                  </span>
                )}
                <span className="hidden w-14 shrink-0 text-right text-[12px] tabular-nums text-ink-soft sm:block">
                  조회 {p.view_count}
                </span>
                <time className="hidden w-12 shrink-0 text-right text-[12px] text-ink-soft md:block">
                  {fmtKstRelative(p.created_at)}
                </time>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
