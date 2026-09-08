import { ArrowUpRight } from "lucide-react";
import { SITE } from "@/lib/constants";
import { DiscordIcon } from "@/components/community/discord-cta";
import { cn } from "@/lib/utils";

/** 네이버(N) 아이콘 */
function NaverIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M16.273 12.845 7.376 0H0v24h7.726V11.156L16.624 24H24V0h-7.727v12.845Z" />
    </svg>
  );
}

/** 트레이딩 채널 바로가기 — 디스코드 + 네이버 카페 거래소. */
export function NaverCafeCta({ className }: { className?: string }) {
  const discordReady = SITE.discord && SITE.discord !== "#";
  const cafeReady = SITE.naverCafe && SITE.naverCafe !== "#";
  const cafeHref = SITE.naverCafeTrade || SITE.naverCafe;

  if (!discordReady && !cafeReady) return null;

  return (
    <div className={cn("grid gap-2 sm:grid-cols-2", className)}>
      {/* 디스코드 */}
      {discordReady ? (
        <a
          href={SITE.discord}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-2xl border border-[#5865F2]/30 bg-[#5865F2]/10 px-4 py-3 transition hover:bg-[#5865F2]/15"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#5865F2] text-white">
            <DiscordIcon className="h-[18px] w-[18px]" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-body-md font-bold text-ink">디스코드 거래 채널</span>
            <span className="block text-body-sm text-ink-soft">실시간 흥정 · 매칭</span>
          </span>
          <ArrowUpRight className="h-4 w-4 shrink-0 text-ink-soft" />
        </a>
      ) : (
        <div className="flex items-center gap-3 rounded-2xl border border-line/70 bg-card px-4 py-3 opacity-60">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#5865F2] text-white">
            <DiscordIcon className="h-[18px] w-[18px]" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-body-md font-bold text-ink">디스코드 거래 채널</span>
            <span className="block text-body-sm text-ink-soft">준비 중</span>
          </span>
        </div>
      )}

      {/* 네이버 카페 거래소 */}
      {cafeReady && (
        <a
          href={cafeHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-2xl border border-[#03C75A]/30 bg-[#03C75A]/10 px-4 py-3 transition hover:bg-[#03C75A]/15"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#03C75A] text-white">
            <NaverIcon className="h-4 w-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-body-md font-bold text-ink">리프트바운드 카드 거래소</span>
            <span className="block text-body-sm text-ink-soft">네이버 카페 · 카드 판매 게시판</span>
          </span>
          <ArrowUpRight className="h-4 w-4 shrink-0 text-ink-soft" />
        </a>
      )}
    </div>
  );
}
