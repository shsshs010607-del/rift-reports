import { PageHeading, ComingSoon } from "@/components/ui/page-heading";

export default function DeckDetailPage({ params }: { params: { slug: string } }) {
  return (
    <div>
      <PageHeading title="덱 상세" description={`slug: ${params.slug}`} />
      <ComingSoon note="덱리스트(메인/룬/사이드보드), 매치업, 공략 본문, 관련 리포트 링크." />
    </div>
  );
}
