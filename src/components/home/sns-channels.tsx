import { Instagram, MessageCircle, Youtube, Users } from "lucide-react";

const CHANNELS = [
  { icon: Youtube, name: "유튜브 채널", handle: "리프트 리포트 공식 영상", note: "메타 해설 & 덱 가이드", href: "#" },
  { icon: Instagram, name: "인스타그램", handle: "@riftreport", note: "카드 일러스트 & 신규 소식", href: "#" },
  { icon: Users, name: "네이버 카페", handle: "리프트바운드 유저 모임", note: "한국 커뮤니티 & 거래", href: "#" },
  { icon: MessageCircle, name: "디스코드", handle: "RiftReport Community", note: "실시간 덱 토론 & 친선전", href: "#" },
];

/**
 * 커뮤니티 & SNS 채널 그리드. 실제 채널 URL 확정 전 플레이스홀더(#).
 */
export function SnsChannels() {
  return (
    <section>
      <h2 className="mb-1 font-display text-title-md font-bold text-ink">커뮤니티 & SNS 채널</h2>
      <p className="mb-4 text-body-sm text-ink-soft">
        공략 영상, 일러스트 프리뷰, 실시간 덱 상담에 참여해 보세요.
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {CHANNELS.map((c) => (
          <a
            key={c.name}
            href={c.href}
            className="flex flex-col gap-2 rounded-2xl border border-line bg-card p-4 transition hover:-translate-y-0.5 hover:border-primary/40"
          >
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary-wash text-primary-strong">
              <c.icon className="h-[18px] w-[18px]" />
            </span>
            <span className="text-label-lg font-bold text-ink">{c.name}</span>
            <span className="text-label-sm text-ink-soft">{c.handle}</span>
            <span className="text-label-sm font-semibold text-primary-strong">{c.note}</span>
          </a>
        ))}
      </div>
    </section>
  );
}
