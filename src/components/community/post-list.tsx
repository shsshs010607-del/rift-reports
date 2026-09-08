import Link from "next/link";
import { Eye, Heart, Layers, MessageSquare, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtKstListTime, fmtKstRelative } from "@/lib/datetime";
import { POPULAR_POST } from "@/lib/constants";
import type { PostListItem } from "@/lib/community";
import { CategoryBadge, metaFor } from "./category-meta";

const isFresh = (iso: string) => Date.now() - new Date(iso).getTime() < 1000 * 60 * 60 * 6;

const IMG_RE =
  /!\[[^\]]*\]\(\s*(https?:\/\/[^\s)]+?)\s*\)|(https?:\/\/[^\s)]+\.(?:png|jpe?g|gif|webp|avif))(?:\?[^\s)]*)?/i;

/** 본문에서 대표 썸네일 후보(붙여넣은 이미지 URL) 하나. */
function thumbOf(body: string): string | null {
  const m = body?.match(IMG_RE);
  return m ? m[1] || m[2] : null;
}

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
      <div className="note-card grid place-items-center px-6 py-16 text-center">
        <p className="text-body-md text-ink-soft">{emptyText}</p>
      </div>
    );
  }

  return (
    <ul className="overflow-hidden rounded-xl border border-line/70 bg-card">
      {posts.map((p) => {
        const m = metaFor(p.category);
        const Icon = m.icon;
        const thumb = thumbOf(p.body);
        const hasDeck = !thumb && /```deck|\[\[[^\]]+\]\]/.test(p.body ?? "");
        const hot = !p.is_notice && p.like_count >= POPULAR_POST.minLikes;

        return (
          <li key={p.id} className="border-b border-line/40 last:border-0">
            <Link
              href={`/community/post/${p.id}`}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2.5 transition-colors hover:bg-primary/[0.045]",
                p.is_notice && "bg-primary/[0.055]",
              )}
            >
              {/* 썸네일 슬롯 — 이미지 있으면 이미지, 없으면 게시판 색 아이콘 */}
              <span
                className={cn(
                  "relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-lg",
                  thumb ? "bg-subcanvas" : cn(m.soft, m.fg),
                )}
              >
                {thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={thumb}
                    alt=""
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover"
                  />
                ) : hasDeck ? (
                  <Layers className="h-5 w-5" />
                ) : (
                  <Icon className="h-5 w-5" />
                )}
              </span>

              {/* 본문 */}
              <span className="flex min-w-0 flex-1 flex-col justify-center gap-1">
                <span className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
                  {p.is_notice && (
                    <span className="rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold text-white">
                      공지
                    </span>
                  )}
                  {hot && (
                    <span className="inline-flex items-center gap-0.5 rounded bg-coral/15 px-1 py-0.5 text-[10px] font-bold text-coral">
                      <Sparkles className="h-2.5 w-2.5" />
                      인기
                    </span>
                  )}
                  <span
                    className={cn(
                      "min-w-0 flex-1 truncate text-body-md font-semibold sm:text-body-lg",
                      p.is_notice ? "text-primary-strong" : "text-ink",
                    )}
                  >
                    {p.title}
                  </span>
                  {p.comment_count > 0 && (
                    <span className="inline-flex shrink-0 items-center gap-0.5 rounded-md bg-primary/10 px-1.5 py-0.5 text-[12px] font-bold text-primary-strong">
                      <MessageSquare className="h-3 w-3" />
                      {p.comment_count}
                    </span>
                  )}
                  {!p.is_notice && isFresh(p.created_at) && (
                    <span className="shrink-0 rounded bg-emerald/15 px-1 text-[10px] font-bold text-emerald">
                      NEW
                    </span>
                  )}
                </span>

                <span className="flex items-center gap-1.5 text-[12px] text-ink-soft">
                  {showCategory && !p.is_notice && (
                    <>
                      <CategoryBadge slug={p.category} className="shrink-0" />
                      <span aria-hidden className="text-ink-soft/40">
                        ·
                      </span>
                    </>
                  )}
                  <span className="truncate font-medium text-ink-soft">
                    {p.author?.username ?? "익명"}
                  </span>
                  <span aria-hidden className="text-ink-soft/40">
                    ·
                  </span>
                  <time
                    dateTime={p.created_at}
                    title={fmtKstListTime(p.created_at)}
                    className="shrink-0"
                  >
                    {fmtKstRelative(p.created_at)}
                  </time>
                </span>
              </span>

              {/* 지표 */}
              <span className="flex shrink-0 flex-col items-end justify-center gap-1 text-[12px] tabular-nums text-ink-soft">
                <span
                  className={cn(
                    "inline-flex items-center gap-1",
                    p.like_count > 0 && "font-bold text-coral",
                  )}
                >
                  <Heart
                    className={cn("h-3 w-3", p.like_count > 0 && "fill-coral")}
                  />
                  {p.like_count}
                </span>
                <span className="inline-flex items-center gap-1 text-ink-soft/80">
                  <Eye className="h-3 w-3" />
                  {p.view_count}
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
