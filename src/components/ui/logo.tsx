import { cn } from "@/lib/utils";

/**
 * 리바지지(RIBA.GG) 로고 마크.
 *
 * ─ 파일 ─
 *   public/brand/logo.png   637×465 RGBA. 교체 시 같은 경로에 덮어쓰고 width/height 만 맞춘다.
 */
const LOGO_SRC = "/brand/logo.png";

export function LogoMark({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={LOGO_SRC}
      alt="리바지지 로고"
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
        리바지지
      </span>
    </span>
  );
}
