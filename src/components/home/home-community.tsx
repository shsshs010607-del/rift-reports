import Link from "next/link";
import { MessageSquare, PenSquare, ArrowRight } from "lucide-react";

import { getPosts } from "@/lib/community";
import { fmtKstRelative } from "@/lib/datetime";
import { CategoryBadge } from "@/components/community/category-meta";

const isFresh = (iso: string) => Date.now() - new Date(iso).getTime() < 1000 * 60 * 60 * 6;

/** 홈 메인 — 커뮤니티 최신글 피드. 사이트 핵심 목적. */
export async function HomeCommunity() {
  const latest = await getPosts({ page: 1 });
  const posts = latest.posts.slice(0, 12);

  return (
    <section className="note-card flex flex-col p-4 pr-6 sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-1.5 font-display text-title-md font-bold text-ink">
          <MessageSquare className="h-4 w-4 text-primary" />
          커뮤니티 최신글
        </h2>
        <div className="flex items-center gap-1.5">
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

      {posts.length === 0 ? (
        <div className="grid flex-1 place-items-center py-12 text-center">
          <p className="text-body-sm text-ink-soft">
            아직 글이 없습니다.{" "}
            <Link href="/community/new" className="font-bold text-primary-strong">
              첫 글 쓰기 →
            </Link>
          </p>
        </div>
      ) : (
        <ul className="flex flex-1 flex-col divide-y divide-line/40">
          {posts.map((p) => (
            <li key={p.id}>
              <Link
                href={`/community/post/${p.id}`}
                className={cnRow(p.is_notice)}
              >
                {p.is_notice ? (
                  <span className="shrink-0 rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold text-white">
                    공지
                  </span>
                ) : (
                  <CategoryBadge slug={p.category} className="shrink-0" />
                )}
                <span
                  className={
                    "min-w-0 flex-1 truncate text-body-md " +
                    (p.is_notice ? "font-bold text-primary-strong" : "text-ink")
                  }
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
                <time className="hidden w-12 shrink-0 text-right text-[12px] text-ink-soft sm:block">
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

function cnRow(isNotice: boolean) {
  return (
    "flex items-center gap-2 py-2 transition-colors hover:text-primary-strong " +
    (isNotice ? "-mx-1 rounded bg-primary/[0.04] px-1" : "")
  );
}
