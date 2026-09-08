import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtKstListTime, fmtKstRelative } from "@/lib/datetime";
import type { PostListItem } from "@/lib/community";
import { CategoryBadge } from "./category-meta";

const isFresh = (iso: string) => Date.now() - new Date(iso).getTime() < 1000 * 60 * 60 * 6;

export function PostList({
  posts,
  showCategory = false,
  emptyText = "아직 글이 없습니다. 첫 글을 남겨보세요.",
}: {
  posts: PostListItem[];
  showCategory?: boolean;
  emptyText?: string;
}) {
  if (posts.length === 0) {
    return (
      <div className="note-card grid place-items-center px-6 py-14 text-center">
        <p className="text-body-md text-ink-soft">{emptyText}</p>
      </div>
    );
  }

  return (
    <ul className="overflow-hidden rounded-xl border border-line/70 bg-card">
      {posts.map((p) => (
        <li key={p.id} className="border-b border-line/40 last:border-0">
          <Link
            href={`/community/post/${p.id}`}
            className={cn(
              "flex items-center gap-2 px-3 py-2.5 transition-colors hover:bg-primary/[0.04]",
              p.is_notice && "bg-primary/[0.05]",
            )}
          >
            {p.is_notice ? (
              <span className="shrink-0 rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold text-white">
                공지
              </span>
            ) : (
              showCategory && <CategoryBadge slug={p.category} className="shrink-0" />
            )}

            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span
                className={cn(
                  "flex items-center gap-1.5 text-body-md leading-tight",
                  p.is_notice ? "font-bold text-primary-strong" : "text-ink",
                )}
              >
                <span className="min-w-0 truncate">{p.title}</span>
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
              </span>
              <span className="flex items-center gap-1.5 text-[12px] text-ink-soft">
                <span className="truncate">{p.author?.username ?? "익명"}</span>
                <span aria-hidden>·</span>
                <time dateTime={p.created_at} title={fmtKstListTime(p.created_at)}>
                  {fmtKstRelative(p.created_at)}
                </time>
              </span>
            </span>

            <span className="flex shrink-0 flex-col items-end gap-0.5 text-[12px] tabular-nums text-ink-soft">
              <span className={cn(p.like_count > 0 && "font-bold text-ink")}>♥ {p.like_count}</span>
              <span className="text-ink-soft/80">조회 {p.view_count}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
