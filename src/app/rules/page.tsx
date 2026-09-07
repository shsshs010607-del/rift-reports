import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BeginnerGuide } from "@/components/rules/beginner-guide";

export const metadata: Metadata = {
  title: "룰",
  description: "리프트바운드 초보자 가이드 — 게임 목표, 준비, 게임판 구역, 턴 진행, 자원, 전투, 점수.",
};

export default function RulesPage() {
  return (
    <div>
      <header className="mb-6">
        <h1 className="font-display text-headline-md text-ink">룰 · 초보자 가이드</h1>
        <p className="mt-0.5 text-body-md text-ink-soft">
          Riftbound Core Rules(2025-12-01) 요약. 정확한 판정은 최신 공식 룰을 따르세요.
        </p>
      </header>

      <BeginnerGuide />

      <Link
        href="/glossary"
        className="mt-8 inline-flex items-center gap-1.5 rounded-full border border-line px-4 py-2 text-label-md font-bold text-ink-soft transition hover:border-primary/40 hover:text-ink"
      >
        키워드·용어 사전 보기
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
