import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { BoardToolbar } from "@/components/community/board-toolbar";
import { PostList } from "@/components/community/post-list";
import { Pagination } from "@/components/community/pagination";
import { RecentBoards } from "@/components/community/recent-boards";
import { metaFor } from "@/components/community/category-meta";
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

  const m = metaFor(slug);
  const Icon = m.icon;

  return (
    <div>
      <Link
        href="/community"
        className="mb-3 inline-flex items-center gap-1 text-body-sm text-ink-soft hover:text-primary-strong"
      >
        <ChevronLeft className="h-4 w-4" />
        커뮤니티
      </Link>
      <header
        className={`mb-6 flex items-center gap-3.5 rounded-2xl bg-gradient-to-r ${m.band} to-transparent p-4`}
      >
        <span
          className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-card ${m.fg} shadow-sm`}
        >
          <Icon className="h-6 w-6" />
        </span>
        <div>
          <h1 className="font-display text-headline-md text-ink">{category.label}</h1>
          <p className="text-body-sm text-ink-soft">{category.desc}</p>
        </div>
      </header>
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
