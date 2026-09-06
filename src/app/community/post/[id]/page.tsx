import { PageHeading, ComingSoon } from "@/components/ui/page-heading";

export default function PostDetailPage({ params }: { params: { id: string } }) {
  return (
    <div>
      <PageHeading title="게시글" description={`id: ${params.id}`} />
      <ComingSoon note="본문 렌더, 좋아요, 작성자 메뉴(수정/삭제 — RLS로 본인만), 댓글 트리(comments.parent_id), 댓글 작성 폼." />
    </div>
  );
}
