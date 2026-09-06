import { PageHeading, ComingSoon } from "@/components/ui/page-heading";

export default function CardDetailPage({ params }: { params: { id: string } }) {
  return (
    <div>
      <PageHeading title="카드 상세" description={`id: ${params.id}`} />
      <ComingSoon note="카드 이미지, 스탯, 룰 텍스트, 등장 덱, 거래 시세(trade_listings 집계)." />
    </div>
  );
}
