import Link from "next/link";
import { Flame } from "lucide-react";

import { getPopularPosts, getPosts } from "@/lib/community";
import { CategoryBadge } from "@/components/community/category-meta";

/** 홈 우측 — 인기글 패널. 인기글이 없으면 조회수 상위 최신글로 폴백. */
export async function HomePopular() {
  const [popular, latest] = await Promise.all([getPopularPosts({}), getPosts({ page: 1 })]);
  const fallback = [...latest.posts]
    .filter((p) => !p.is_notice)
    .sort((a, b) => b.view_count - a.view_count)
    .slice(0, 5);
  const list = popular.posts.length > 0 ? popular.posts.slice(0, 6) : fallback;
  const usingPopular = popular.posts.length > 0;

  return (
    <div className="note-card p-4 pr-6">
      <div className="mb-2.5 flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-label-lg font-bold text-ink">
          <Flame className="h-4 w-4 text-primary" />
          {usingPopular ? "인기글" : "많이 본 글"}
        </h3>
        <Link
          href="/community?tab=popular"
          className="text-label-sm text-ink-soft hover:text-primary-strong"
        >
          더보기
        </Link>
      </div>

      {list.length === 0 ? (
        <p className="py-6 text-center text-body-sm text-ink-soft">아직 글이 없습니다.</p>
      ) : (
        <ol className="flex flex-col gap-1.5">
          {list.map((p, i) => (
            <li key={p.id}>
              <Link
                href={`/community/post/${p.id}`}
                className="flex items-center gap-2 text-body-md leading-tight hover:text-primary-strong"
              >
                <span className="w-4 shrink-0 text-center text-label-sm font-black text-primary-strong">
                  {i + 1}
                </span>
                <CategoryBadge slug={p.category} className="shrink-0" />
                <span className="min-w-0 flex-1 truncate text-ink">{p.title}</span>
                <span className="shrink-0 text-[12px] font-bold text-primary-strong">
                  {usingPopular ? `♥ ${p.like_count}` : `조회 ${p.view_count}`}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
