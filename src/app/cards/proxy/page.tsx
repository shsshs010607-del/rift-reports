import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { PageHeading } from "@/components/ui/page-heading";
import { ProxyBuilder } from "@/components/cards/proxy-builder";

export const metadata: Metadata = {
  title: "프록시 출력",
  description: "리프트바운드 카드를 인쇄용 프록시 시트(A4·실물 규격)로 뽑습니다.",
};

export default function ProxyPage() {
  return (
    <div>
      <Link
        href="/cards"
        className="mb-3 inline-flex items-center gap-1 text-body-sm text-ink-soft hover:text-primary-strong"
      >
        <ChevronLeft className="h-4 w-4" />
        카드 정보
      </Link>
      <PageHeading
        title="프록시 출력"
        description="플레이테스트용 카드 프록시. 리프트바운드 규격(63×88mm)으로 A4에 9장씩 배치해 저장합니다."
      />
      <ProxyBuilder />
    </div>
  );
}
