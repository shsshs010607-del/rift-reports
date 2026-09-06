import type { Metadata } from "next";
import { PageHeading } from "@/components/ui/page-heading";
import { RulesTabs } from "@/components/rules/rules-tabs";
import { BeginnerGuide } from "@/components/rules/beginner-guide";
import { GlossaryBrowser } from "@/components/rules/glossary-browser";

export const metadata: Metadata = {
  title: "룰 & 용어",
  description: "리프트바운드 초보자 가이드 — 게임 목표, 준비물, 턴 순서, 자원, 전투, 점수와 용어집.",
};

export default function RulesPage() {
  return (
    <div>
      <PageHeading
        title="룰 및 용어 정리"
        description="Riftbound Core Rules(2025-12-01) 요약. 정확한 판정은 최신 공식 룰을 따르세요."
      />
      <RulesTabs guide={<BeginnerGuide />} glossary={<GlossaryBrowser />} />
    </div>
  );
}
