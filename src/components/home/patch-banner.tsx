import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

/** 상단 패치 안내 — 박스 없이 얇은 줄로 섹션 구분. */
export function PatchBanner() {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-line/60 pb-3 text-body-sm">
      <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-label-sm font-bold text-white">
        <Sparkles className="h-3 w-3" />
        OGN 출시
      </span>
      <span className="text-ink-soft">
        리프트바운드 &lsquo;오리진&rsquo;이 9월 18일 한국 정식 출시됩니다. 카드 DB·덱 시뮬레이터·시세는 지금
        이용할 수 있어요.
      </span>
      <Link
        href="/rules"
        className="ml-auto inline-flex shrink-0 items-center gap-0.5 font-semibold text-primary-strong hover:underline"
      >
        초보자 가이드 <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
