import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { BoardToolbar } from "@/components/community/board-toolbar";
import { PostList } from "@/components/community/post-list";
import { Pagination } from "@/components/community/pagination";
import { RecentBoards } from "@/components/community/recent-boards";
import { DiscordCta } from "@/components/community/discord-cta";
import { metaFor } from "@/components/community/category-meta";
import { getPosts, getPopularPosts, getRecentByCategory } from "@/lib/community";
import { COMMUNITY_CATEGORIES, POSTS_PER_PAGE } from "@/lib/constants";

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

  const [list, recent] = await Promise.all([
    popular ? getPopularPosts({ page }) : getPosts({ q, page }),
    getRecentByCategory(4),
  ]);

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
      <header className="mb-6">
        <h1 className="font-display text-headline-md text-ink">커뮤니티</h1>
        <p className="mt-0.5 text-body-md text-ink-soft">
          리프트바운드 유저들의 이야기 · 공략 · 정보
        </p>
      </header>

      <DiscordCta className="mb-6" />

      <div className="mb-8 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
        {COMMUNITY_CATEGORIES.map((c) => {
          const m = metaFor(c.slug);
          const Icon = m.icon;
          return (
            <Link
              key={c.slug}
              href={`/community/${c.slug}`}
              className={`group flex flex-col gap-2 rounded-2xl border border-line/70 bg-card p-3.5 transition ${m.ring}`}
            >
              <span className={`grid h-9 w-9 place-items-center rounded-xl ${m.soft} ${m.fg}`}>
                <Icon className="h-[18px] w-[18px]" />
              </span>
              <span className="text-body-md font-bold text-ink">{c.label}</span>
              <span className="line-clamp-1 text-[12px] text-ink-soft">{c.desc}</span>
            </Link>
          );
        })}
      </div>

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
