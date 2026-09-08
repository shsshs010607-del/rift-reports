import { Users, ArrowUpRight } from "lucide-react";
import { SITE } from "@/lib/constants";
import { cn } from "@/lib/utils";

/** 네이버 카페(리프트바운드 마켓플레이스) 거래 게시판 바로가기 배너. */
export function NaverCafeCta({ className }: { className?: string }) {
  const base = SITE.naverCafe && SITE.naverCafe !== "#" ? SITE.naverCafe : null;
  if (!base) return null;
  const href = SITE.naverCafeTrade || base;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "flex items-center gap-3 rounded-2xl border border-[#03C75A]/30 bg-[#03C75A]/10 px-4 py-3 transition hover:bg-[#03C75A]/15",
        className,
      )}
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#03C75A] text-white">
        <Users className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-body-md font-bold text-ink">네이버 카페 거래 게시판</p>
        <p className="text-body-sm text-ink-soft">
          리프트바운드 마켓플레이스 · 카드 판매·구매·교환 글 바로 보기
        </p>
      </div>
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#03C75A] px-3 py-1.5 text-label-sm font-bold text-white">
        거래글 보기
        <ArrowUpRight className="h-3.5 w-3.5" />
      </span>
    </a>
  );
}
