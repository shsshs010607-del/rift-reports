import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { PageHeading } from "@/components/ui/page-heading";
import { BoardToolbar } from "@/components/community/board-toolbar";
import { PostList } from "@/components/community/post-list";
import { Pagination } from "@/components/community/pagination";
import { RecentBoards } from "@/components/community/recent-boards";
import { getPosts, getPopularPosts, getRecentByCategory } from "@/lib/community";
import { COMMUNITY_CATEGORIES, POSTS_PER_PAGE } from "@/lib/constants";
import type { CommunityCategory } from "@/lib/types/database";

export const revalidate = 30;

export function generateStaticParams() {
  return COMMUNITY_CATEGORIES.map((c) => ({ category: c.slug }));
}

export function generateMetadata({ params }: { params: { category: string } }): Metadata {
  const c = COMMUNITY_CATEGORIES.find((x) => x.slug === params.category);
  return { title: c ? `커뮤니티 · ${c.label}` : "커뮤니티" };
}

export default async function BoardPage({
  params,
  searchParams,
}: {
  params: { category: string };
  searchParams: { tab?: string; q?: string; page?: string };
}) {
  const category = COMMUNITY_CATEGORIES.find((c) => c.slug === params.category);
  if (!category) notFound();
  const slug = category.slug as CommunityCategory;

  const page = Number(searchParams.page) || 1;
  const q = searchParams.q?.trim() || undefined;
  const popular = searchParams.tab === "popular" && !q;

  const [list, recent] = await Promise.all([
    popular ? getPopularPosts({ category: slug, page }) : getPosts({ category: slug, q, page }),
    getRecentByCategory(4),
  ]);

  const hrefFor = (p: number) => {
    const sp = new URLSearchParams();
    if (searchParams.tab) sp.set("tab", searchParams.tab);
    if (q) sp.set("q", q);
    if (p > 1) sp.set("page", String(p));
    const s = sp.toString();
    return s ? `/community/${slug}?${s}` : `/community/${slug}`;
  };

  return (
    <div>
      <PageHeading title={category.label} description={category.desc} />
      <Suspense fallback={<div className="mb-4 h-24" />}>
        <BoardToolbar writeHref={`/community/new?category=${slug}`} />
      </Suspense>
      <PostList
        posts={list.posts}
        emptyText={q ? "검색 결과가 없습니다." : "아직 글이 없습니다. 첫 글을 남겨보세요!"}
      />
      <Pagination page={list.page} total={list.total} perPage={POSTS_PER_PAGE} hrefFor={hrefFor} />
      <RecentBoards data={recent} exclude={slug} />
    </div>
  );
}
