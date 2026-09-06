import { PageHeading, ComingSoon } from "@/components/ui/page-heading";

export default function ReportDetailPage({ params }: { params: { slug: string } }) {
  return (
    <div>
      <PageHeading title="리포트" description={`slug: ${params.slug}`} />
      <ComingSoon note="커버, 제목, 작성자, 본문(MDX/rich text) 렌더, 관련 덱/카드 링크, 조회수 증가(RPC)." />
    </div>
  );
}
