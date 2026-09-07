import Link from "next/link";
import { Pin, MessageSquare, Heart } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { PostListItem } from "@/lib/community";
import { Avatar } from "./avatar";
import { CategoryBadge } from "./category-meta";

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
      <div className="grid place-items-center rounded-2xl border border-line/70 bg-card px-6 py-16 text-center">
        <p className="text-body-md text-ink-soft">{emptyText}</p>
      </div>
    );
  }

  return (
    <ul className="overflow-hidden rounded-2xl border border-line/70 bg-card">
      {posts.map((p) => (
        <li key={p.id} className="border-b border-line/50 last:border-0">
          <Link
            href={`/community/post/${p.id}`}
            className={cn(
              "flex flex-col gap-1.5 px-4 py-3.5 transition-colors hover:bg-subcanvas/50",
              p.is_notice && "bg-primary/[0.04]",
            )}
          >
            <div className="flex items-center gap-1.5">
              {p.is_notice ? (
                <span className="shrink-0 rounded-md bg-primary px-1.5 py-0.5 text-[11px] font-bold text-white">
                  공지
                </span>
              ) : (
                <>
                  {p.is_pinned && <Pin className="h-3.5 w-3.5 shrink-0 text-primary" />}
                  {showCategory && <CategoryBadge slug={p.category} className="shrink-0" />}
                </>
              )}
              <span
                className={cn(
                  "line-clamp-1 text-body-lg font-semibold text-ink",
                  p.is_notice && "text-primary-strong",
                )}
              >
                {p.title}
              </span>
              {p.comment_count > 0 && (
                <span className="shrink-0 text-body-sm font-bold text-primary-strong">
                  {p.comment_count}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-[13px] text-ink-soft">
              <Avatar name={p.author?.username} src={p.author?.avatar_url} size="sm" />
              <span className="font-medium text-ink/80">{p.author?.username ?? "알 수 없음"}</span>
              <span aria-hidden>·</span>
              <time dateTime={p.created_at}>
                {formatDistanceToNow(new Date(p.created_at), { addSuffix: true, locale: ko })}
              </time>
              <span className="ml-auto flex items-center gap-2.5">
                <span className="inline-flex items-center gap-1">
                  <Heart className="h-3.5 w-3.5" />
                  {p.like_count}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MessageSquare className="h-3.5 w-3.5" />
                  {p.comment_count}
                </span>
              </span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
