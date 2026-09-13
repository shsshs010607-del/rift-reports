import { Youtube, Globe, Newspaper, ArrowUpRight } from "lucide-react";
import { SITE, RIFTBOUND_NEWS } from "@/lib/constants";
import { fmtKstDate } from "@/lib/datetime";
import { cn } from "@/lib/utils";

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

const TAG_STYLE: Record<string, string> = {
  공지: "bg-primary-fixed text-on-primary-fixed-variant",
  대회: "bg-secondary-fixed text-on-secondary-fixed-variant",
  이벤트: "bg-tertiary-fixed text-on-tertiary-fixed",
};

/** 리프트바운드 공식 새소식 요약 (홈 중단) + 공식 채널 바로가기. */
export function OfficialLinks({ className }: { className?: string }) {
  return (
    <section className={cn("", className)}>
      <div className="mb-3 flex items-end justify-between">
        <h2 className="section-title flex items-center gap-1.5">
          <Newspaper className="h-4 w-4 text-primary" />
          리프트바운드 새소식
        </h2>
        <a
          href={SITE.officialSite}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-label-md font-bold text-primary-strong hover:underline"
        >
          공식 사이트
          <ArrowUpRight className="h-3.5 w-3.5" />
        </a>
      </div>

      <ul className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {RIFTBOUND_NEWS.map((n) => (
          <li key={n.url}>
            <a
              href={n.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex h-full flex-col gap-1.5 rounded-2xl border border-line/70 bg-card p-3.5 transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-e2"
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-label-sm font-bold",
                    TAG_STYLE[n.tag] ?? "bg-surface-container text-on-surface-variant",
                  )}
                >
                  {n.tag}
                </span>
                <time className="shrink-0 text-label-sm text-ink-soft">{fmtKstDate(n.date)}</time>
              </div>
              <p className="line-clamp-2 text-body-md font-bold leading-snug text-ink group-hover:text-primary-strong">
                {n.title}
              </p>
              <p className="line-clamp-2 text-body-sm text-ink-soft">{n.summary}</p>
            </a>
          </li>
        ))}
      </ul>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <OfficialLink href={SITE.officialSite} icon={<Globe className="h-4 w-4" />} label="공식 홈페이지" />
        <OfficialLink
          href={SITE.officialTwitter}
          icon={<XIcon className="h-3.5 w-3.5" />}
          label="공식 트위터 (X)"
        />
        <OfficialLink
          href={SITE.officialYoutube}
          icon={<Youtube className="h-4 w-4" />}
          label="공식 유튜브"
        />
      </div>
    </section>
  );
}

function OfficialLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-center gap-1.5 rounded-xl border border-line/70 bg-card px-3 py-2.5 text-body-sm font-bold text-ink-soft transition hover:border-primary/40 hover:text-primary-strong"
    >
      {icon}
      {label}
    </a>
  );
}
