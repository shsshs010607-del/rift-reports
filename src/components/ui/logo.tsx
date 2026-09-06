import { cn } from "@/lib/utils";

/**
 * 리프트 리포트 로고 마크.
 *
 * ─ 파일 ─
 *   public/brand/logo.png   ← 첨부 원본(1024²·흰 배경)을 흰 배경 투명화 + 콘텐츠 크롭한 637×465 RGBA.
 *                              (처리 스크립트: scratchpad/png-process.js — 테두리 연결 흰색만 투명, 내부 divider 유지)
 *   public/brand/logo.svg   ← 벡터 대체본.
 *   원본을 다시 처리하려면 위 스크립트로 재생성 후 같은 경로에 덮어쓰면 된다.
 */
const LOGO_SRC = "/brand/logo.png";

export function LogoMark({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={LOGO_SRC}
      alt="리프트 리포트 로고"
      width={637}
      height={465}
      className={cn("h-8 w-auto select-none object-contain", className)}
    />
  );
}

/** 로고 마크 + 워드마크. */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("flex shrink-0 items-center gap-2.5", className)}>
      <LogoMark className="h-9 w-auto" />
      <span className="font-display text-headline-sm font-extrabold tracking-tight text-on-surface">
        리프트 리포트
      </span>
    </span>
  );
}
