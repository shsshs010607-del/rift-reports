import Link from "next/link";
import { Megaphone, Pin } from "lucide-react";
import { cn } from "@/lib/utils";
import { COMMUNITY_CATEGORIES } from "@/lib/constants";
import type { PostListItem } from "@/lib/community";
import { AuthorTag, PostStats } from "./post-meta";

const catLabel = (slug: string) => COMMUNITY_CATEGORIES.find((c) => c.slug === slug)?.label ?? slug;

export function PostList({
  posts,
  showCategory = false,
  emptyText = "아직 글이 없습니다. 첫 글을 남겨보세요!",
}: {
  posts: PostListItem[];
  showCategory?: boolean;
  emptyText?: string;
}) {
  if (posts.length === 0) {
    return (
      <div className="grid place-items-center rounded-2xl border-2 border-dashed border-line bg-subcanvas/40 px-6 py-14 text-center">
        <p className="text-body-md text-ink-soft">{emptyText}</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-line/70 overflow-hidden rounded-2xl border border-line/80 bg-card shadow-e1">
      {posts.map((p) => (
        <li key={p.id}>
          <Link
            href={`/community/post/${p.id}`}
            className={cn(
              "flex flex-col gap-1.5 p-4 transition hover:bg-subcanvas/50",
              p.is_notice && "bg-amber/[0.06] hover:bg-amber/10",
            )}
          >
            <div className="flex items-start gap-2">
              {p.is_notice && (
                <span className="mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-full bg-amber/15 px-2 py-0.5 text-label-sm font-bold uppercase text-[#B45309]">
                  <Megaphone className="h-3 w-3" />
                  공지
                </span>
              )}
              {!p.is_notice && p.is_pinned && (
                <Pin className="mt-1 h-3.5 w-3.5 shrink-0 text-primary" />
              )}
              {showCategory && (
                <span className="mt-0.5 shrink-0 rounded-full bg-primary-wash px-2 py-0.5 text-label-sm text-primary-strong">
                  {catLabel(p.category)}
                </span>
              )}
              <p
                className={cn(
                  "font-display text-title-md text-ink",
                  p.is_notice && "text-[#B45309]",
                )}
              >
                {p.title}
                {p.comment_count > 0 && (
                  <span className="ml-1.5 text-primary-strong">[{p.comment_count}]</span>
                )}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <AuthorTag author={p.author} />
              <PostStats
                views={p.view_count}
                comments={p.comment_count}
                likes={p.like_count}
                createdAt={p.created_at}
              />
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
