import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { GlossaryBrowser } from "@/components/rules/glossary-browser";

export const metadata: Metadata = {
  title: "용어",
  description: "리프트바운드 키워드·룰 용어 사전. 한글·영문 검색, 카드 효과 연동.",
};

export default function GlossaryPage() {
  return (
    <div>
      <Link
        href="/rules"
        className="mb-3 inline-flex items-center gap-1 text-body-sm text-ink-soft hover:text-primary-strong"
      >
        <ArrowLeft className="h-4 w-4" />룰 · 초보자 가이드
      </Link>
      <header className="mb-6">
        <h1 className="font-display text-headline-md text-ink">용어 사전</h1>
        <p className="mt-0.5 text-body-md text-ink-soft">
          키워드 · 룰 용어. 한글·영문 모두 검색되고, 카드 효과 텍스트와 연결됩니다.
        </p>
      </header>

      <GlossaryBrowser />
    </div>
  );
}
