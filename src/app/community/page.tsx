import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { BoardToolbar } from "@/components/community/board-toolbar";
import { CommunityMigrationNotice } from "@/components/community/community-migration-notice";
import { CategoryTabs } from "@/components/community/category-tabs";
import { PostList } from "@/components/community/post-list";
import { Pagination } from "@/components/community/pagination";
import { CommunitySidebar } from "@/components/community/community-sidebar";
import { DiscordCta } from "@/components/community/discord-cta";
import { CafeArticleList } from "@/components/community/cafe-article-list";
import {
  getPosts,
  getPopularPosts,
  getRecentByCategory,
  getTrendingPosts,
} from "@/lib/community";
import { getCafeArticles } from "@/lib/naver-cafe";
import { POSTS_PER_PAGE, SITE } from "@/lib/constants";

export const metadata: Metadata = { title: "커뮤니티", alternates: { canonical: "/community" } };
export const revalidate = 30;

export default async function CommunityHubPage(
  props: {
    searchParams: Promise<{ tab?: string; q?: string; tag?: string; page?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  const page = Number(searchParams.page) || 1;
  const q = searchParams.q?.trim() || undefined;
  const tag = searchParams.tag?.trim() || undefined;
  const popular = searchParams.tab === "popular" && !q && !tag;

  // 기본 화면 = 네이버 카페 자유게시판 연동 목록. 검색·태그·인기 탭은 기존 사이트 글.
  const cafeMode = !q && !tag && !popular;
  const [list, cafe, recent, trending] = await Promise.all([
    cafeMode ? null : popular ? getPopularPosts({ page }) : getPosts({ q, tag, page }),
    cafeMode ? getCafeArticles({ page, perPage: POSTS_PER_PAGE }) : null,
    getRecentByCategory(3),
    getTrendingPosts(6),
  ]);

  const hrefFor = (p: number) => {
    const sp = new URLSearchParams();
    if (searchParams.tab) sp.set("tab", searchParams.tab);
    if (q) sp.set("q", q);
    if (tag) sp.set("tag", tag);
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
      <CommunityMigrationNotice className="mb-5" />
      <DiscordCta className="mb-5" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_290px] lg:items-start">
        {/* 메인 — 카페 자유게시판 최신글 (검색/태그/인기는 사이트 글) */}
        <div>
          <h2 className="mb-3 text-title-md font-bold text-ink">
            {q ? `"${q}" 검색 결과` : tag ? `#${tag}` : popular ? "인기글" : "카페 자유게시판 최신글"}
          </h2>
          <Suspense fallback={<div className="mb-4 h-24" />}>
            <BoardToolbar />
          </Suspense>
          {cafe ? (
            <>
              <CafeArticleList articles={cafe.articles} />
              <nav className="mt-4 flex items-center justify-center gap-2 text-label-md font-bold">
                {page > 1 && (
                  <Link href={hrefFor(page - 1)} className="btn-ghost !py-1.5">
                    이전
                  </Link>
                )}
                <span className="px-2 text-ink-soft">{page}</span>
                {cafe.hasNext && (
                  <Link href={hrefFor(page + 1)} className="btn-ghost !py-1.5">
                    다음
                  </Link>
                )}
                <a
                  href={SITE.naverCafeBoardByCategory.riftbound}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 text-[#03C75A] hover:underline"
                >
                  카페에서 전체 보기 ↗
                </a>
              </nav>
            </>
          ) : list ? (
            <>
              <PostList
                posts={list.posts}
                showCategory
                emptyText={q || tag ? "검색 결과가 없습니다." : "아직 글이 없습니다."}
              />
              <Pagination
                page={list.page}
                total={list.total}
                perPage={POSTS_PER_PAGE}
                hrefFor={hrefFor}
              />
            </>
          ) : null}
        </div>

        {/* 사이드바 — 실시간 인기글 + 게시판별 최신 */}
        <CommunitySidebar trending={trending} recent={recent} />
      </div>
    </div>
  );
}
