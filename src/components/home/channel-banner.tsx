import Link from "next/link";
import { ArrowUpRight, Instagram, Mail, Youtube } from "lucide-react";
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

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.714 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
    </svg>
  );
}

const isReady = (href: string) => Boolean(href) && href !== "#";

/** SNS 아이콘 바로가기 — URL 미확정("#")이면 흐리게 비활성. */
function SnsIcon({
  href,
  label,
  brand,
  children,
}: {
  href: string;
  label: string;
  brand: string;
  children: React.ReactNode;
}) {
  const base = "grid h-9 w-9 place-items-center rounded-full border transition";
  if (!isReady(href)) {
    return (
      <span
        aria-label={`${label} (준비 중)`}
        title={`${label} · 준비 중`}
        className={cn(base, "cursor-default border-line bg-card text-ink-soft/45")}
      >
        {children}
      </span>
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
      className={cn(base, "border-transparent text-white hover:brightness-110")}
      style={{ backgroundColor: brand }}
    >
      {children}
    </a>
  );
}

/** 네이버 카페 · 디스코드 · SNS 바로가기 — 얇은 한 줄. */
export function ChannelBanner({ className }: { className?: string }) {
  const cafeReady = isReady(SITE.naverCafe);
  const discordReady = isReady(SITE.discord);

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
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

      {/* SNS 아이콘 바로가기 */}
      <span className="flex items-center gap-1.5">
        <SnsIcon href={SITE.instagram} label="인스타그램" brand="#E1306C">
          <Instagram className="h-4 w-4" />
        </SnsIcon>
        <SnsIcon href={SITE.youtube} label="유튜브" brand="#FF0000">
          <Youtube className="h-4 w-4" />
        </SnsIcon>
        <SnsIcon href={SITE.x} label="X (트위터)" brand="#000000">
          <XIcon className="h-3.5 w-3.5" />
        </SnsIcon>
      </span>

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
