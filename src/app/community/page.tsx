import type { Metadata } from "next";
import { Suspense } from "react";
import { BoardToolbar } from "@/components/community/board-toolbar";
import { CategoryTabs } from "@/components/community/category-tabs";
import { PostList } from "@/components/community/post-list";
import { Pagination } from "@/components/community/pagination";
import { CommunitySidebar } from "@/components/community/community-sidebar";
import { DiscordCta } from "@/components/community/discord-cta";
import {
  getPosts,
  getPopularPosts,
  getRecentByCategory,
  getTrendingPosts,
} from "@/lib/community";
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

  const [list, recent, trending] = await Promise.all([
    popular
      ? getPopularPosts({ page })
      : // 전체 최신글에서 게시판별 고정글(리프트 리포트 등)은 제외 — 각 게시판 탭에서 확인
        getPosts({ q, page, excludePinned: !q }),
    getRecentByCategory(3),
    getTrendingPosts(6),
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
      <header className="mb-4">
        <h1 className="font-display text-headline-md text-ink">커뮤니티</h1>
        <p className="mt-0.5 text-body-md text-ink-soft">
          리프트바운드 유저들의 이야기 · 공략 · 정보
        </p>
      </header>

      <CategoryTabs />
      <DiscordCta className="mb-5" />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_290px] lg:items-start">
        {/* 메인 — 전체 최신글 */}
        <div>
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
          <Pagination
            page={list.page}
            total={list.total}
            perPage={POSTS_PER_PAGE}
            hrefFor={hrefFor}
          />
        </div>

        {/* 사이드바 — 실시간 인기글 + 게시판별 최신 */}
        <CommunitySidebar trending={trending} recent={recent} />
      </div>
    </div>
  );
}
