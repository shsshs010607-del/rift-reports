import type { Metadata } from "next";
import { PageHeading, ComingSoon } from "@/components/ui/page-heading";

export const metadata: Metadata = { title: "룰 & 용어" };

export default function RulesPage() {
  return (
    <div>
      <PageHeading title="룰 및 용어 정리" description="초보자 가이드 · 게임 용어 검색" />
      <ComingSoon note="상단: 초보자 가이드(정적 MDX 또는 reports 재사용). 하단: 용어 검색 인풋 + glossary_terms 목록(카테고리 필터, 관련 용어 링크)." />
    </div>
  );
}
