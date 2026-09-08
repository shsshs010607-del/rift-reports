import { Users, ArrowUpRight } from "lucide-react";
import { SITE } from "@/lib/constants";
import { cn } from "@/lib/utils";

/** 네이버 카페(리프트바운드 마켓플레이스) 바로가기 배너. */
export function NaverCafeCta({ className }: { className?: string }) {
  const ready = SITE.naverCafe && SITE.naverCafe !== "#";
  if (!ready) return null;
  return (
    <a
      href={SITE.naverCafe}
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
        <p className="text-body-md font-bold text-ink">리프트바운드 마켓플레이스 (네이버 카페)</p>
        <p className="text-body-sm text-ink-soft">한국 유저 카드 거래 · 시세 정보 · 덱 자랑</p>
      </div>
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#03C75A] px-3 py-1.5 text-label-sm font-bold text-white">
        카페 가기
        <ArrowUpRight className="h-3.5 w-3.5" />
      </span>
    </a>
  );
}
