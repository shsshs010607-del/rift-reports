import { PageHeading, ComingSoon } from "@/components/ui/page-heading";

export default function TournamentDetailPage({ params }: { params: { slug: string } }) {
  return (
    <div>
      <PageHeading title="대회 상세" description={`slug: ${params.slug}`} />
      <ComingSoon note="개요, 일정, 참가 방법(registration_url), 상금, 결과(종료 시). 주최자만 편집." />
    </div>
  );
}
