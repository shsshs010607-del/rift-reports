import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { ArrowRight } from "lucide-react";
import { COMMUNITY_CATEGORIES } from "@/lib/constants";
import type { PostListItem } from "@/lib/community";
import type { CommunityCategory } from "@/lib/types/database";
import { metaFor } from "./category-meta";

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
      <h2 className="mb-4 text-title-md font-bold text-ink">다른 게시판</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cats.map((c) => {
          const posts = data[c.slug] ?? [];
          const m = metaFor(c.slug);
          const Icon = m.icon;
          return (
            <div key={c.slug} className="note-card flex flex-col p-4 pr-5">
              <Link
                href={`/community/${c.slug}`}
                className="group mb-2.5 flex items-center gap-2"
              >
                <span className={`grid h-7 w-7 place-items-center rounded-lg ${m.soft} ${m.fg}`}>
                  <Icon className="h-4 w-4" />
                </span>
                <span className="text-body-md font-bold text-ink group-hover:text-primary-strong">
                  {c.label}
                </span>
                <ArrowRight className="ml-auto h-4 w-4 text-ink-soft transition group-hover:translate-x-0.5 group-hover:text-primary-strong" />
              </Link>
              {posts.length === 0 ? (
                <p className="py-2 text-body-sm text-ink-soft/70">글 없음</p>
              ) : (
                <ul className="flex flex-col">
                  {posts.map((p) => (
                    <li key={p.id}>
                      <Link
                        href={`/community/post/${p.id}`}
                        className="group flex items-baseline gap-2 py-1"
                      >
                        <span className="truncate text-[13px] text-ink-soft group-hover:text-ink">
                          {p.is_notice && <span className="mr-1 font-bold text-primary">[공지]</span>}
                          {p.title}
                        </span>
                        <time className="ml-auto shrink-0 text-[12px] text-ink-soft/70">
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
