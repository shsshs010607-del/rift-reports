import { getPopularPosts, getPosts } from "@/lib/community";
import { CommunityFeed } from "@/components/home/community-feed";

/** 홈 메인 — 커뮤니티(최신·인기 탭). 사이트 핵심 목적. */
export async function HomeCommunity() {
  // 리프트 리포트·덱공략 템플릿 등 고정글은 홈 피드에서 제외 (각 게시판에서 확인)
  const [latest, popular] = await Promise.all([
    getPosts({ page: 1, excludeCategory: "report", excludePinned: true }),
    getPopularPosts({}),
  ]);
  return <CommunityFeed latest={latest.posts} popular={popular.posts} />;
}
