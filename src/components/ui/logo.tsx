import { cn } from "@/lib/utils";

/**
 * 리프트 리포트 로고 마크.
 *
 * ─ 파일 위치 ─
 *   public/brand/logo.png   ← 직접 첨부한 원본 이미지를 여기에 저장 (흰 배경 포함 가능)
 *   public/brand/logo.svg   ← 지금 쓰이는 벡터 대체본 (배경 투명)
 *   원본 PNG 를 넣었으면 아래 `LOGO_SRC` 만 "/brand/logo.png" 로 바꾸면 끝.
 *
 * ─ 배경 처리 ─
 *   원본 PNG 의 흰 배경은 `mix-blend-mode: multiply` 로 밝은 헤더/푸터 배경에 녹아든다
 *   (흰색×배경 = 배경색 → 사실상 투명, 보라 로고는 유지). 별도 이미지 편집 불필요.
 *   투명 PNG/SVG 에는 이 블렌드가 영향을 주지 않으므로 그대로 둬도 안전하다.
 */
const LOGO_SRC = "/brand/logo.svg"; // 원본 이미지 저장 후 "/brand/logo.png" 로 교체

export function LogoMark({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={LOGO_SRC}
      alt="리프트 리포트 로고"
      width={512}
      height={512}
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
