import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { PageHeading } from "@/components/ui/page-heading";
import { BoardToolbar } from "@/components/community/board-toolbar";
import { PostList } from "@/components/community/post-list";
import { Pagination } from "@/components/community/pagination";
import { RecentBoards } from "@/components/community/recent-boards";
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
      <PageHeading title="커뮤니티" description="리프트바운드 유저들의 이야기 · 공략 · 정보" />

      {/* 게시판 바로가기 */}
      <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {COMMUNITY_CATEGORIES.map((c) => (
          <Link key={c.slug} href={`/community/${c.slug}`} className="surface surface-hover p-4">
            <p className="font-display text-title-md text-ink">{c.label}</p>
            <p className="mt-0.5 text-body-sm text-ink-soft">{c.desc}</p>
          </Link>
        ))}
      </div>

      <h2 className="section-title mb-3">{q ? `"${q}" 검색 결과` : popular ? "전체 인기글" : "전체 최신글"}</h2>
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
