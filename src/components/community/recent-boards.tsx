import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { COMMUNITY_CATEGORIES } from "@/lib/constants";
import type { PostListItem } from "@/lib/community";
import type { CommunityCategory } from "@/lib/types/database";

/** 하단: 다른 게시판 최신글 모아보기 */
export function RecentBoards({
  data,
  exclude,
}: {
  data: Record<CommunityCategory, PostListItem[]>;
  exclude?: CommunityCategory;
}) {
  const cats = COMMUNITY_CATEGORIES.filter((c) => c.slug !== exclude);

  return (
    <section className="mt-12">
      <h2 className="section-title mb-4">다른 게시판 최신글</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cats.map((c) => {
          const posts = data[c.slug] ?? [];
          return (
            <div key={c.slug} className="surface flex flex-col p-4">
              <div className="mb-2 flex items-center justify-between">
                <Link href={`/community/${c.slug}`} className="font-display text-title-md text-ink hover:text-primary-strong">
                  {c.label}
                </Link>
                <Link href={`/community/${c.slug}`} className="text-body-sm text-primary-strong hover:underline">
                  더보기
                </Link>
              </div>
              {posts.length === 0 ? (
                <p className="py-3 text-body-sm text-ink-soft">글 없음</p>
              ) : (
                <ul className="flex flex-col gap-1.5">
                  {posts.map((p) => (
                    <li key={p.id}>
                      <Link href={`/community/post/${p.id}`} className="group flex items-baseline gap-2">
                        <span className="truncate text-body-md text-ink-soft group-hover:text-ink">
                          {p.is_notice && <span className="mr-1 text-[#B45309]">[공지]</span>}
                          {p.title}
                        </span>
                        <time className="ml-auto shrink-0 text-body-sm text-ink-soft">
                          {formatDistanceToNow(new Date(p.created_at), { locale: ko })}
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
  );
}
