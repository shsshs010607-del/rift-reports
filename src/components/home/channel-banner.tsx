import Link from "next/link";
import { ArrowUpRight, Mail } from "lucide-react";
import { SITE } from "@/lib/constants";
import { DiscordIcon } from "@/components/community/discord-cta";
import { cn } from "@/lib/utils";

function NaverIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M16.273 12.845 7.376 0H0v24h7.726V11.156L16.624 24H24V0h-7.727v12.845Z" />
    </svg>
  );
}

/** 네이버 카페 · 디스코드 바로가기 — 얇은 한 줄. */
export function ChannelBanner({ className }: { className?: string }) {
  const discordReady = Boolean(SITE.discord && SITE.discord !== "#");
  const cafeReady = Boolean(SITE.naverCafe && SITE.naverCafe !== "#");

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {cafeReady && (
        <a
          href={SITE.naverCafe}
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex items-center gap-2 rounded-full bg-[#03C75A] px-4 py-2 text-label-md font-bold text-white transition hover:brightness-105"
        >
          <NaverIcon className="h-3.5 w-3.5" />
          네이버 카페 카드거래
          <ArrowUpRight className="h-3.5 w-3.5 opacity-80 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </a>
      )}

      {discordReady ? (
        <a
          href={SITE.discord}
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex items-center gap-2 rounded-full bg-[#5865F2] px-4 py-2 text-label-md font-bold text-white transition hover:brightness-105"
        >
          <DiscordIcon className="h-3.5 w-3.5" />
          디스코드
          <ArrowUpRight className="h-3.5 w-3.5 opacity-80 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </a>
      ) : (
        <span className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-4 py-2 text-label-md font-bold text-ink-soft">
          <DiscordIcon className="h-3.5 w-3.5" />
          디스코드
          <span className="rounded-full bg-subcanvas px-1.5 py-0.5 text-[10px]">준비 중</span>
        </span>
      )}

      <Link
        href="/community/recruit"
        className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-4 py-2 text-label-md font-bold text-ink-soft transition hover:border-primary/40 hover:text-ink"
      >
        <Mail className="h-3.5 w-3.5" />
        문의하기
      </Link>
    </div>
  );
}
