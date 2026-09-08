import { ArrowUpRight } from "lucide-react";
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

/** 홈 상단 — 네이버 카페 · 디스코드 크게. */
export function ChannelBanner({ className }: { className?: string }) {
  const discordReady = Boolean(SITE.discord && SITE.discord !== "#");
  const cafeReady = Boolean(SITE.naverCafe && SITE.naverCafe !== "#");

  return (
    <div className={cn("grid gap-3 sm:grid-cols-2", className)}>
      {cafeReady ? (
        <a
          href={SITE.naverCafe}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-4 rounded-2xl bg-[#03C75A] p-5 text-white shadow-[0_10px_30px_-8px_rgba(3,199,90,0.5)] transition hover:brightness-105"
        >
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white/15">
            <NaverIcon className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-title-md font-black">네이버 카페</span>
            <span className="block text-body-sm text-white/85">
              리프트바운드 마켓플레이스 · 카드 거래
            </span>
          </span>
          <ArrowUpRight className="h-5 w-5 shrink-0 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </a>
      ) : (
        <ChannelStub label="네이버 카페" />
      )}

      {discordReady ? (
        <a
          href={SITE.discord}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-4 rounded-2xl bg-[#5865F2] p-5 text-white shadow-[0_10px_30px_-8px_rgba(88,101,242,0.5)] transition hover:brightness-105"
        >
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white/15">
            <DiscordIcon className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-title-md font-black">디스코드</span>
            <span className="block text-body-sm text-white/85">실시간 덱 상담 · 흥정 · 매칭</span>
          </span>
          <ArrowUpRight className="h-5 w-5 shrink-0 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </a>
      ) : (
        <ChannelStub label="디스코드" icon="discord" />
      )}
    </div>
  );
}

function ChannelStub({ label, icon }: { label: string; icon?: "discord" }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-line/70 bg-card p-5 text-ink-soft">
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-subcanvas text-ink-soft">
        {icon === "discord" ? (
          <DiscordIcon className="h-5 w-5" />
        ) : (
          <NaverIcon className="h-5 w-5" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-title-md font-black text-ink">{label}</span>
        <span className="block text-body-sm">채널 개설 후 연결됩니다</span>
      </span>
      <span className="shrink-0 rounded-full bg-subcanvas px-2.5 py-1 text-label-sm font-bold">
        준비 중
      </span>
    </div>
  );
}
