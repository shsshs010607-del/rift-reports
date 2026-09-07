import Link from "next/link";
import { format, isToday } from "date-fns";
import { cn } from "@/lib/utils";
import type { PostListItem } from "@/lib/community";
import { CategoryBadge } from "./category-meta";

const when = (iso: string) => {
  const d = new Date(iso);
  return isToday(d) ? format(d, "HH:mm") : format(d, "MM.dd");
};

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
      <div className="grid place-items-center rounded-2xl border border-line/70 bg-card px-6 py-14 text-center">
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
              "flex items-center gap-2 px-3 py-1.5 text-body-md leading-tight transition-colors hover:bg-subcanvas/50",
              p.is_notice && "bg-primary/[0.04]",
            )}
          >
            {p.is_notice ? (
              <span className="shrink-0 rounded bg-primary px-1 py-0.5 text-[10px] font-bold text-white">
                공지
              </span>
            ) : (
              showCategory && <CategoryBadge slug={p.category} className="shrink-0" />
            )}

            <span
              className={cn(
                "min-w-0 flex-1 truncate text-ink",
                p.is_notice && "font-bold text-primary-strong",
              )}
            >
              {p.title}
              {p.comment_count > 0 && (
                <span className="ml-1 font-bold text-primary-strong">[{p.comment_count}]</span>
              )}
            </span>

            <span className="hidden w-20 shrink-0 truncate text-right text-[12px] text-ink-soft sm:inline">
              {p.author?.username ?? "—"}
            </span>
            <time className="w-10 shrink-0 text-right text-[12px] tabular-nums text-ink-soft">
              {when(p.created_at)}
            </time>
            <span className="w-8 shrink-0 text-right text-[12px] tabular-nums text-ink-soft">
              ♥{p.like_count}
            </span>
            <span className="hidden w-12 shrink-0 text-right text-[12px] tabular-nums text-ink-soft/80 sm:inline">
              조회 {p.view_count}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
