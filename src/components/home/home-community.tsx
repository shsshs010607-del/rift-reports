import { getPopularPosts, getPosts } from "@/lib/community";
import { CommunityFeed } from "@/components/home/community-feed";

/** 홈 메인 — 커뮤니티(최신·인기 탭). 사이트 핵심 목적. */
export async function HomeCommunity() {
  // 리프트 리포트는 홈에 별도 패널이 있으므로 커뮤니티 피드에서 제외
  const [latest, popular] = await Promise.all([
    getPosts({ page: 1, excludeCategory: "report" }),
    getPopularPosts({}),
  ]);
  return <CommunityFeed latest={latest.posts} popular={popular.posts} />;
}
