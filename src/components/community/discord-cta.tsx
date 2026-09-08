import { SITE } from "@/lib/constants";
import { cn } from "@/lib/utils";

/** 디스코드 아이콘 (브랜드 SVG — lucide 미제공). */
export function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M20.317 4.369a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.865-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.6 12.6 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.74 19.74 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.1 13.1 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.009c.12.099.246.198.373.292a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.056c.5-5.177-.838-9.674-3.549-13.66a.06.06 0 0 0-.031-.028ZM8.02 15.331c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.418 2.157-2.418 1.21 0 2.176 1.094 2.157 2.418 0 1.334-.955 2.419-2.157 2.419Zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.418 2.157-2.418 1.21 0 2.176 1.094 2.157 2.418 0 1.334-.946 2.419-2.157 2.419Z" />
    </svg>
  );
}

/** 커뮤니티 디스코드 바로가기 배너. SITE.discord 가 설정되면 활성화. */
export function DiscordCta({ className }: { className?: string }) {
  const ready = SITE.discord && SITE.discord !== "#";
  const Wrapper = ready ? "a" : "div";
  return (
    <Wrapper
      {...(ready ? { href: SITE.discord, target: "_blank", rel: "noopener noreferrer" } : {})}
      className={cn(
        "flex items-center gap-3 rounded-2xl border px-4 py-3 transition",
        ready
          ? "border-[#5865F2]/30 bg-[#5865F2]/10 hover:bg-[#5865F2]/15"
          : "border-line/70 bg-card",
        className,
      )}
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#5865F2] text-white">
        <DiscordIcon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-body-md font-bold text-ink">리바지지 디스코드</p>
        <p className="text-body-sm text-ink-soft">
          {ready ? "실시간 잡담 · 매칭 · 대회 공지 — 지금 참여하기" : "채널 준비 중 — 곧 공개됩니다"}
        </p>
      </div>
      {ready && (
        <span className="shrink-0 rounded-full bg-[#5865F2] px-3 py-1.5 text-label-sm font-bold text-white">
          입장
        </span>
      )}
    </Wrapper>
  );
}
