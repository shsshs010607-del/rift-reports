import Link from "next/link";
import { Flame, MessageSquare, Newspaper } from "lucide-react";

import { fmtKstRelative } from "@/lib/datetime";
import { COMMUNITY_CATEGORIES } from "@/lib/constants";
import type { PostListItem } from "@/lib/community";
import type { CommunityCategory } from "@/lib/types/database";
import { CategoryBadge, metaFor } from "./category-meta";

/** 게시판별 최신 목록에서는 뺀다 — 리프트 리포트는 위에 전용 섹션으로 따로 노출. */
const SIDEBAR_CATEGORIES = COMMUNITY_CATEGORIES.filter((c) => c.slug !== "report");

/** 커뮤니티 허브 우측 사이드바 — 실시간 인기글 + 게시판별 최신글 (작게). */
export function CommunitySidebar({
  trending,
  recent,
}: {
  trending: PostListItem[];
  recent: Record<CommunityCategory, PostListItem[]>;
}) {
  return (
    <aside className="flex flex-col gap-4 lg:sticky lg:top-[88px]">
      {trending.length > 0 && (
        <section className="rounded-xl border border-line/70 bg-card p-3.5">
          <h2 className="mb-2 flex items-center gap-1.5 text-label-lg font-bold text-ink">
            <Flame className="h-4 w-4 text-coral" />
            실시간 인기글
          </h2>
          <ol className="flex flex-col">
            {trending.map((p, i) => (
              <li key={p.id}>
                <Link
                  href={`/community/post/${p.id}`}
                  className="flex items-start gap-2 py-1.5 hover:text-primary-strong"
                >
                  <span
                    className={`mt-0.5 w-4 shrink-0 text-center text-[12px] font-black ${
                      i < 3 ? "text-coral" : "text-ink-soft/60"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-1 text-[13px] font-medium text-ink">{p.title}</span>
                    <span className="flex items-center gap-1 text-[11px] text-ink-soft">
                      <CategoryBadge slug={p.category} showIcon={false} />
                      <span>조회 {p.view_count}</span>
                      {p.comment_count > 0 && (
                        <span className="inline-flex items-center gap-0.5">
                          <MessageSquare className="h-2.5 w-2.5" />
                          {p.comment_count}
                        </span>
                      )}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}

      {(recent.report ?? []).length > 0 && (
        <section className="rounded-xl border border-primary/25 bg-primary-wash/40 p-3.5">
          <Link
            href="/community/report"
            className="group mb-2 flex items-center gap-1.5 text-label-lg font-bold text-ink"
          >
            <Newspaper className="h-4 w-4 text-primary-strong" />
            <span className="group-hover:text-primary-strong">리프트 리포트</span>
          </Link>
          <ul className="flex flex-col">
            {recent.report.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/community/post/${p.id}`}
                  className="flex items-baseline gap-1.5 py-1 text-[13px] text-ink hover:text-primary-strong"
                >
                  <span className="min-w-0 flex-1 truncate font-medium">{p.title}</span>
                  <time className="shrink-0 text-[11px] text-ink-soft/60">
                    {fmtKstRelative(p.created_at)}
                  </time>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-xl border border-line/70 bg-card p-3.5">
        <h2 className="mb-2 text-label-lg font-bold text-ink">게시판별 최신</h2>
        <div className="flex flex-col gap-3">
          {SIDEBAR_CATEGORIES.map((c) => {
            const posts = (recent[c.slug] ?? []).slice(0, 3);
            const m = metaFor(c.slug);
            const Icon = m.icon;
            return (
              <div key={c.slug}>
                <Link
                  href={`/community/${c.slug}`}
                  className={`group mb-1 flex items-center gap-1.5 text-[13px] font-bold ${m.fg}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="text-ink group-hover:text-primary-strong">{c.label}</span>
                </Link>
                {posts.length === 0 ? (
                  <p className="pl-5 text-[12px] text-ink-soft/60">글 없음</p>
                ) : (
                  <ul className="flex flex-col pl-5">
                    {posts.map((p) => (
                      <li key={p.id}>
                        <Link
                          href={`/community/post/${p.id}`}
                          className="flex items-baseline gap-1.5 py-0.5 text-[12px] text-ink-soft hover:text-ink"
                        >
                          <span className="min-w-0 flex-1 truncate">
                            {p.is_notice && <span className="font-bold text-primary">[공지] </span>}
                            {p.title}
                          </span>
                          <time className="shrink-0 text-[11px] text-ink-soft/60">
                            {fmtKstRelative(p.created_at)}
                          </time>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </aside>
  );
}
