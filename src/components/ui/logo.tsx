import { cn } from "@/lib/utils";

/**
 * 리바지지(RIBA.GG) 로고.
 *
 * ─ 파일 ─
 *   public/brand/logo.png   가로형 로고 락업(스월 마크 + "RIBA.GG").
 *                           배경이 어두워도 됨 — 아래 "플레이트"가 감싸서 자연스럽게 얹힌다.
 *                           교체 시 같은 경로에 덮어쓰기. 여백 없는 타이트 크롭 권장(대략 6:1).
 */
const LOGO_SRC = "/brand/logo.png";

/**
 * 로고 이미지만 (마크+워드마크 락업).
 * 어두운 배경 로고를 밝은 상단바 위에 얹기 위해 짙은 라운드 플레이트로 감싼다.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-xl bg-[#141210] px-2.5 py-1.5 ring-1 ring-white/10",
        className,
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={LOGO_SRC}
        alt="리바지지 RIBA.GG"
        className="h-6 w-auto select-none object-contain"
      />
    </span>
  );
}

/** 로고 (락업 하나로 끝 — 별도 텍스트 불필요). */
export function Logo({ className }: { className?: string }) {
  return <LogoMark className={cn("shrink-0", className)} />;
}
