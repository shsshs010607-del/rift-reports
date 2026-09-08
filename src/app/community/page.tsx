import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Flame, MessageSquare } from "lucide-react";
import { BoardToolbar } from "@/components/community/board-toolbar";
import { CategoryTabs } from "@/components/community/category-tabs";
import { PostList } from "@/components/community/post-list";
import { Pagination } from "@/components/community/pagination";
import { RecentBoards } from "@/components/community/recent-boards";
import { DiscordCta } from "@/components/community/discord-cta";
import { CategoryBadge } from "@/components/community/category-meta";
import { getPosts, getPopularPosts, getRecentByCategory } from "@/lib/community";
import { POSTS_PER_PAGE } from "@/lib/constants";

export const metadata: Metadata = { title: "커뮤니티" };
export const revalidate = 30;

export default async function CommunityHubPage({
  searchParams,
}: {
  searchParams: { tab?: string; q?: string; page?: string };
}) {
  const page = Number(searchParams.page) || 1;
  const q = searchParams.q?.trim() || undefined;
  const popular = searchParams.tab === "popular" && !q;
  const plain = !q && !popular && page === 1;

  const [list, recent, hotRes] = await Promise.all([
    popular ? getPopularPosts({ page }) : getPosts({ q, page }),
    getRecentByCategory(4),
    plain ? getPopularPosts({ page: 1 }) : Promise.resolve(null),
  ]);
  const hot = (hotRes?.posts ?? []).slice(0, 4);

  const hrefFor = (p: number) => {
    const sp = new URLSearchParams();
    if (searchParams.tab) sp.set("tab", searchParams.tab);
    if (q) sp.set("q", q);
    if (p > 1) sp.set("page", String(p));
    const s = sp.toString();
    return s ? `/community?${s}` : "/community";
  };

  return (
    <div>
      <header className="mb-5">
        <h1 className="font-display text-headline-md text-ink">커뮤니티</h1>
        <p className="mt-0.5 text-body-md text-ink-soft">
          리프트바운드 유저들의 이야기 · 공략 · 정보
        </p>
      </header>

      <CategoryTabs />

      {hot.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-2.5 flex items-center gap-1.5 text-title-md font-bold text-ink">
            <Flame className="h-4 w-4 text-coral" />
            지금 뜨는 글
          </h2>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {hot.map((p) => (
              <Link
                key={p.id}
                href={`/community/post/${p.id}`}
                className="group flex flex-col gap-2 rounded-xl border border-line/70 bg-card p-3.5 transition hover:border-coral/40 hover:bg-coral/[0.03]"
              >
                <span className="flex items-center gap-1.5">
                  <CategoryBadge slug={p.category} />
                  <span className="ml-auto inline-flex items-center gap-1 text-[12px] font-bold text-coral">
                    ♥ {p.like_count}
                  </span>
                </span>
                <span className="line-clamp-2 text-body-md font-semibold text-ink group-hover:text-primary-strong">
                  {p.title}
                </span>
                <span className="flex items-center gap-1.5 text-[12px] text-ink-soft">
                  <span className="truncate">{p.author?.username ?? "익명"}</span>
                  {p.comment_count > 0 && (
                    <span className="inline-flex items-center gap-0.5">
                      <MessageSquare className="h-3 w-3" />
                      {p.comment_count}
                    </span>
                  )}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <DiscordCta className="mb-6" />

      <h2 className="mb-3 text-title-md font-bold text-ink">
        {q ? `"${q}" 검색 결과` : popular ? "인기글" : "전체 최신글"}
      </h2>
      <Suspense fallback={<div className="mb-4 h-24" />}>
        <BoardToolbar writeHref="/community/new" />
      </Suspense>
      <PostList
        posts={list.posts}
        showCategory
        emptyText={q ? "검색 결과가 없습니다." : "아직 글이 없습니다."}
      />
      <Pagination page={list.page} total={list.total} perPage={POSTS_PER_PAGE} hrefFor={hrefFor} />

      <RecentBoards data={recent} />
    </div>
  );
}
