import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

/**
 * 상단 패치/집계 배너. 지금은 정적 문구 — 패치노트 CMS 연동 전 플레이스홀더.
 */
export function PatchBanner() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-2xl border border-primary/20 bg-primary-wash/50 px-4 py-3 text-body-sm">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-2.5 py-0.5 text-label-sm font-bold text-white">
        <Sparkles className="h-3 w-3" />
        패치 준비 중
      </span>
      <span className="text-ink-soft">
        완성 덱·시세·랭킹 데이터 연동 전입니다. 카드 정보와 덱 시뮬레이터는 지금 사용할 수 있어요.
      </span>
      <Link
        href="/rules"
        className="ml-auto inline-flex items-center gap-0.5 font-semibold text-primary-strong hover:underline"
      >
        초보자 가이드 <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
