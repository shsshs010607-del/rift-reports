import { cn } from "@/lib/utils";

/**
 * 리바지지(RIBA.GG) 로고.
 *
 * ─ 파일 ─
 *   public/brand/logo.png  스월 마크 + "RIBA.GG" 워드마크, 어두운 배경.
 *                          여백이 넉넉해도 됨 — 아래 플레이트가 여백을 잘라내고 배경색을 맞춰 얹는다.
 *                          교체 시 같은 경로에 덮어쓰기.
 */
const LOGO_SRC = "/brand/logo.png";

/**
 * 로고 (마크 + 워드마크 락업).
 * 어두운 배경의 로고를 밝은 상단바 위에 자연스럽게 얹기 위해:
 *  1) 로고 배경색과 맞춘 짙은 라운드 플레이트로 감싸고
 *  2) 이미지를 확대·중앙정렬해 원본의 넓은 여백을 잘라낸다.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative block h-8 w-[164px] shrink-0 overflow-hidden rounded-lg bg-[#191512] ring-1 ring-white/10",
        className,
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={LOGO_SRC}
        alt="리바지지 RIBA.GG"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[420%] max-w-none -translate-x-1/2 -translate-y-1/2 select-none"
      />
    </span>
  );
}

/** 로고 (락업 하나로 끝 — 별도 텍스트 불필요). */
export function Logo({ className }: { className?: string }) {
  return <LogoMark className={className} />;
}
