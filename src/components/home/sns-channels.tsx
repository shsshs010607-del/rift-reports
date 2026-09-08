import { Instagram, MessageCircle, Youtube, Users } from "lucide-react";
import { SITE } from "@/lib/constants";
import { cn } from "@/lib/utils";

const CHANNELS = [
  {
    icon: Youtube,
    name: "유튜브 채널",
    handle: "리바지지 공식 영상",
    note: "메타 해설 & 덱 가이드",
    href: SITE.youtube,
  },
  {
    icon: Instagram,
    name: "인스타그램",
    handle: "@riba.gg",
    note: "카드 일러스트 & 신규 소식",
    href: SITE.instagram,
  },
  {
    icon: Users,
    name: "네이버 카페",
    handle: "리프트바운드 마켓플레이스",
    note: "한국 유저 커뮤니티 & 카드 거래",
    href: SITE.naverCafe,
  },
  {
    icon: MessageCircle,
    name: "디스코드",
    handle: "RIBA.GG Community",
    note: "실시간 덱 토론 & 친선전",
    href: SITE.discord,
  },
];

const ready = (href: string) => Boolean(href) && href !== "#";

/** 커뮤니티 & SNS 채널 그리드. URL 미확정 채널은 "준비 중"으로 비활성. */
export function SnsChannels() {
  return (
    <section>
      <h2 className="mb-1 font-display text-title-md font-bold text-ink">커뮤니티 & SNS 채널</h2>
      <p className="mb-4 text-body-sm text-ink-soft">
        공략 영상, 일러스트 프리뷰, 실시간 덱 상담에 참여해 보세요.
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {CHANNELS.map((c) => {
          const on = ready(c.href);
          const Wrapper = on ? "a" : "div";
          return (
            <Wrapper
              key={c.name}
              {...(on ? { href: c.href, target: "_blank", rel: "noopener noreferrer" } : {})}
              className={cn(
                "flex flex-col gap-2 rounded-2xl border border-line bg-card p-4 transition",
                on ? "hover:-translate-y-0.5 hover:border-primary/40" : "opacity-60",
              )}
            >
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary-wash text-primary-strong">
                <c.icon className="h-[18px] w-[18px]" />
              </span>
              <span className="text-label-lg font-bold text-ink">{c.name}</span>
              <span className="text-label-sm text-ink-soft">{on ? c.handle : "준비 중"}</span>
              <span className="text-label-sm font-semibold text-primary-strong">
                {on ? c.note : "채널 공개 후 연결됩니다"}
              </span>
            </Wrapper>
          );
        })}
      </div>
    </section>
  );
}
