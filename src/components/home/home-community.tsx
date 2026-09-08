import { getPopularPosts, getPosts } from "@/lib/community";
import { CommunityFeed } from "@/components/home/community-feed";

/** 홈 메인 — 커뮤니티(최신·인기 탭). 사이트 핵심 목적. */
export async function HomeCommunity() {
  const [latest, popular] = await Promise.all([getPosts({ page: 1 }), getPopularPosts({})]);
  return <CommunityFeed latest={latest.posts} popular={popular.posts} />;
}
