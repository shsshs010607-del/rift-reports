import { getPopularPosts } from "@/lib/community";
import { getCafeArticles } from "@/lib/naver-cafe";
import { CommunityFeed } from "@/components/home/community-feed";

/** 홈 메인 — 커뮤니티. 최신 = 네이버 카페 자유게시판 연동, 인기 = 기존 사이트 글. */
export async function HomeCommunity() {
  const [cafe, popular] = await Promise.all([
    getCafeArticles({ perPage: 12 }),
    getPopularPosts({}),
  ]);
  return <CommunityFeed cafe={cafe.articles} popular={popular.posts} />;
}
