import "server-only";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { POSTS_PER_PAGE, POPULAR_POST } from "@/lib/constants";
import type { Post, Comment, CommunityCategory } from "@/lib/types/database";

export type Author = { username: string; avatar_url: string | null };
export type PostListItem = Post & { author: Author | null };
export type CommentItem = Comment & { author: Author | null };

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  if (!hasSupabaseEnv) return fallback;
  try {
    return await fn();
  } catch (e) {
    console.error("[community]", e);
    return fallback;
  }
}

/** 게시판 목록 조회 — 정렬은 항상 최신순. 공지·고정글이 상단. */
export function getPosts(opts: {
  category?: CommunityCategory;
  q?: string;
  page?: number;
}) {
  const page = Math.max(1, opts.page ?? 1);
  const from = (page - 1) * POSTS_PER_PAGE;

  return safe<{ posts: PostListItem[]; total: number; page: number }>(
    async () => {
      const supabase = createClient();
      let filter = supabase
        .from("posts")
        .select("*, author:profiles!posts_author_id_fkey(username, avatar_url)", { count: "exact" });

      if (opts.category) filter = filter.eq("category", opts.category);

      const searching = Boolean(opts.q && opts.q.trim());
      if (searching) {
        const term = opts.q!.trim().replace(/[%,()]/g, " ");
        filter = filter.or(`title.ilike.%${term}%,body.ilike.%${term}%`);
      }

      // 검색 중에는 공지 우선정렬을 끄고 순수 최신순
      const ordered = searching
        ? filter.order("created_at", { ascending: false })
        : filter
            .order("is_notice", { ascending: false })
            .order("is_pinned", { ascending: false })
            .order("created_at", { ascending: false });

      const { data, count, error } = await ordered.range(from, from + POSTS_PER_PAGE - 1);
      if (error) throw error;
      return { posts: (data as unknown as PostListItem[]) ?? [], total: count ?? 0, page };
    },
    { posts: [], total: 0, page },
  );
}

/** 인기(상위 추천) 글 — 최근 N일 내 추천 M개 이상, 추천수 내림차순. */
export function getPopularPosts(opts: { category?: CommunityCategory; page?: number }) {
  const page = Math.max(1, opts.page ?? 1);
  const from = (page - 1) * POSTS_PER_PAGE;
  const since = new Date(Date.now() - POPULAR_POST.days * 86400_000).toISOString();

  return safe<{ posts: PostListItem[]; total: number; page: number }>(
    async () => {
      const supabase = createClient();
      let filter = supabase
        .from("posts")
        .select("*, author:profiles!posts_author_id_fkey(username, avatar_url)", { count: "exact" })
        .gte("like_count", POPULAR_POST.minLikes)
        .gte("created_at", since);

      if (opts.category) filter = filter.eq("category", opts.category);

      const { data, count, error } = await filter
        .order("like_count", { ascending: false })
        .order("created_at", { ascending: false })
        .range(from, from + POSTS_PER_PAGE - 1);
      if (error) throw error;
      return { posts: (data as unknown as PostListItem[]) ?? [], total: count ?? 0, page };
    },
    { posts: [], total: 0, page },
  );
}

export function getPost(id: string) {
  return safe<PostListItem | null>(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("posts")
      .select("*, author:profiles!posts_author_id_fkey(username, avatar_url)")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return (data as unknown as PostListItem) ?? null;
  }, null);
}

export function getComments(postId: string) {
  return safe<CommentItem[]>(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("comments")
      .select("*, author:profiles!comments_author_id_fkey(username, avatar_url)")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (data as unknown as CommentItem[]) ?? [];
  }, []);
}

/** 다른 게시판 최신글 — 카테고리별 최근 글 몇 개씩. */
export function getRecentByCategory(perCategory = 4) {
  return safe<Record<CommunityCategory, PostListItem[]>>(async () => {
    const supabase = createClient();
    // 카테고리별로 나눠 조회 (row_number 윈도우 대신 단순 반복 — 카테고리 5개뿐)
    const cats: CommunityCategory[] = ["riftbound", "report", "deck-guide", "tournament", "recruit"];
    const entries = await Promise.all(
      cats.map(async (c) => {
        const { data } = await supabase
          .from("posts")
          .select("*, author:profiles!posts_author_id_fkey(username, avatar_url)")
          .eq("category", c)
          .order("created_at", { ascending: false })
          .limit(perCategory);
        return [c, (data as unknown as PostListItem[]) ?? []] as const;
      }),
    );
    return Object.fromEntries(entries) as Record<CommunityCategory, PostListItem[]>;
  }, {} as Record<CommunityCategory, PostListItem[]>);
}

/** 현재 유저가 추천한 글 id 집합 (목록에서 추천 상태 표시용). */
export function getLikedPostIds(postIds: string[]) {
  return safe<Set<string>>(async () => {
    if (postIds.length === 0) return new Set();
    const supabase = createClient();
    const { data: userRes } = await supabase.auth.getUser();
    if (!userRes.user) return new Set();
    const { data } = await supabase
      .from("post_likes")
      .select("post_id")
      .eq("user_id", userRes.user.id)
      .in("post_id", postIds);
    return new Set((data ?? []).map((r) => r.post_id));
  }, new Set<string>());
}
