import type { Metadata } from "next";
import Link from "next/link";
import { PageHeading, ComingSoon } from "@/components/ui/page-heading";
import { COMMUNITY_CATEGORIES } from "@/lib/constants";

export const metadata: Metadata = { title: "커뮤니티" };

export default function CommunityPage() {
  return (
    <div>
      <PageHeading title="커뮤니티 게시판" description="자유 · 공략/팁 · 덱 분석" />
      <div className="mb-6 flex flex-wrap gap-2">
        {COMMUNITY_CATEGORIES.map((c) => (
          <Link key={c.slug} href={`/community/${c.slug}`} className="btn-ghost">
            {c.label}
          </Link>
        ))}
      </div>
      <ComingSoon note="게시글 목록(카테고리 탭, 정렬, 페이지네이션), 글쓰기 버튼(/community/new), 상세 /community/post/[id] + 댓글. 데이터: posts / comments." />
    </div>
  );
}
