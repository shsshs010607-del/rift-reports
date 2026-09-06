import { PageHeading, ComingSoon } from "@/components/ui/page-heading";

export default function TradeDetailPage({ params }: { params: { id: string } }) {
  return (
    <div>
      <PageHeading title="거래글 상세" description={`id: ${params.id}`} />
      <ComingSoon note="이미지 갤러리, 카드/상태/가격, 판매자 프로필, 연락 방법(로그인 시에만 노출), 상태 변경(본인만)." />
    </div>
  );
}
