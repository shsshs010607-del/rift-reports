import { Play, Youtube, ExternalLink } from "lucide-react";
import { SITE } from "@/lib/constants";
import { cn } from "@/lib/utils";

/** 리프트바운드 공식 채널·영상 바로가기 (홈 중단). */
export function OfficialLinks({ className }: { className?: string }) {
  return (
    <section className={cn("", className)}>
      <h2 className="section-title mb-3">리프트바운드 공식</h2>
      <div className="grid gap-3 md:grid-cols-3">
        <a
          href={SITE.officialHowToPlay}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-4 rounded-2xl bg-gradient-to-br from-[#FF0033] to-[#c40027] p-5 text-white shadow-[0_10px_30px_-10px_rgba(255,0,51,0.5)] transition hover:brightness-105 md:col-span-1"
        >
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white/20">
            <Play className="h-5 w-5 fill-current" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-title-md font-black leading-tight">11분 룰 설명</span>
            <span className="block text-body-sm text-white/85">How to Play Riftbound</span>
          </span>
        </a>

        <a
          href={SITE.officialYoutube}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-4 rounded-2xl border border-line/70 bg-card p-5 transition hover:border-[#FF0033]/40"
        >
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#FF0033]/10 text-[#FF0033]">
            <Youtube className="h-6 w-6" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-body-lg font-bold text-ink group-hover:text-[#FF0033]">
              공식 유튜브
            </span>
            <span className="block text-body-sm text-ink-soft">@riftbound · 최신 영상</span>
          </span>
        </a>

        <a
          href={SITE.officialSite}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-4 rounded-2xl border border-line/70 bg-card p-5 transition hover:border-primary/40"
        >
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary-strong">
            <ExternalLink className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-body-lg font-bold text-ink group-hover:text-primary-strong">
              공식 홈페이지
            </span>
            <span className="block text-body-sm text-ink-soft">규칙 · 카드 · 뉴스</span>
          </span>
        </a>
      </div>
    </section>
  );
}
