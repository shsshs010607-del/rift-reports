import { Coffee, Eye, Heart, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtKstListTime, fmtKstRelative } from "@/lib/datetime";
import type { CafeArticle } from "@/lib/naver-cafe";

const isFresh = (iso: string) => Date.now() - new Date(iso).getTime() < 1000 * 60 * 60 * 6;

/** 네이버 카페 자유게시판 글 목록 — PostList 와 같은 행 모양, 클릭 시 카페 새 탭. */
export function CafeArticleList({
  articles,
  emptyText = "카페 글을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.",
}: {
  articles: CafeArticle[];
  emptyText?: string;
}) {
  if (articles.length === 0) {
    return (
      <div className="note-card grid place-items-center px-6 py-16 text-center">
        <p className="text-body-md text-ink-soft">{emptyText}</p>
      </div>
    );
  }

  return (
    <ul className="overflow-hidden rounded-xl border border-line/70 bg-card">
      {articles.map((a) => (
        <li key={a.id} className="border-b border-line/40 last:border-0">
          <a
            href={a.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 px-3 py-1.5 transition-colors hover:bg-primary/[0.045]"
          >
            <span
              className={cn(
                "relative grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-md",
                a.thumb ? "bg-subcanvas" : "bg-[#03C75A]/10 text-[#03C75A]",
              )}
            >
              {a.thumb ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={a.thumb}
                  alt=""
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />
              ) : (
                <Coffee className="h-4 w-4" />
              )}
            </span>

            <span className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
              <span className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
                <span className="min-w-0 flex-1 truncate text-body-md font-semibold text-ink">
                  {a.title}
                </span>
                {a.commentCount > 0 && (
                  <span className="inline-flex shrink-0 items-center gap-0.5 rounded-md bg-primary/10 px-1.5 py-0.5 text-[12px] font-bold text-primary-strong">
                    <MessageSquare className="h-3 w-3" />
                    {a.commentCount}
                  </span>
                )}
                {isFresh(a.writtenAt) && (
                  <span className="shrink-0 rounded bg-emerald/15 px-1 text-[10px] font-bold text-emerald">
                    NEW
                  </span>
                )}
              </span>
              <span className="flex items-center gap-1.5 text-[12px] text-ink-soft">
                <span className="truncate font-medium">{a.writer}</span>
                <span aria-hidden className="text-ink-soft/40">
                  ·
                </span>
                <time dateTime={a.writtenAt} title={fmtKstListTime(a.writtenAt)} className="shrink-0">
                  {fmtKstRelative(a.writtenAt)}
                </time>
              </span>
            </span>

            <span className="flex shrink-0 flex-col items-end justify-center gap-1 text-[12px] tabular-nums text-ink-soft">
              <span className={cn("inline-flex items-center gap-1", a.likeCount > 0 && "font-bold text-coral")}>
                <Heart className={cn("h-3 w-3", a.likeCount > 0 && "fill-coral")} />
                {a.likeCount}
              </span>
              <span className="inline-flex items-center gap-1 text-ink-soft/80">
                <Eye className="h-3 w-3" />
                {a.readCount}
              </span>
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}
