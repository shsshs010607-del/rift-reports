import { MessageCircle, Newspaper, Layers, Trophy, Users } from "lucide-react";
import type { CommunityCategory } from "@/lib/types/database";
import { cn } from "@/lib/utils";

type Meta = {
  icon: typeof MessageCircle;
  /** 배지용 짧은 이름 */
  short: string;
  /** 아이콘/배지 배경 (구버전 호환) */
  soft: string;
  /** 아이콘/텍스트 색 */
  fg: string;
  /** 카드 호버 링 */
  ring: string;
  /** 헤더 배너용 그라디언트 */
  band: string;
  /** 배지 전체 클래스 (라이트+다크) */
  badge: string;
};

export const CATEGORY_META: Record<string, Meta> = {
  riftbound: {
    icon: MessageCircle,
    short: "자유",
    soft: "bg-violet-100",
    fg: "text-violet-700",
    ring: "hover:border-violet-300",
    band: "from-violet-200/70 via-violet-100/40",
    badge:
      "bg-violet-500/12 text-violet-700 ring-violet-500/25 dark:bg-violet-400/15 dark:text-violet-300 dark:ring-violet-400/30",
  },
  report: {
    icon: Newspaper,
    short: "리포트",
    soft: "bg-sky-100",
    fg: "text-sky-700",
    ring: "hover:border-sky-300",
    band: "from-sky-200/70 via-sky-100/40",
    badge:
      "bg-sky-500/12 text-sky-700 ring-sky-500/25 dark:bg-sky-400/15 dark:text-sky-300 dark:ring-sky-400/30",
  },
  "deck-guide": {
    icon: Layers,
    short: "덱공략",
    soft: "bg-green-100",
    fg: "text-green-700",
    ring: "hover:border-green-300",
    band: "from-green-200/70 via-green-100/40",
    badge:
      "bg-emerald-500/12 text-emerald-700 ring-emerald-500/25 dark:bg-emerald-400/15 dark:text-emerald-300 dark:ring-emerald-400/30",
  },
  tournament: {
    icon: Trophy,
    short: "대회",
    soft: "bg-yellow-100",
    fg: "text-yellow-800",
    ring: "hover:border-yellow-300",
    band: "from-amber-200/70 via-amber-100/40",
    badge:
      "bg-amber-500/15 text-amber-700 ring-amber-500/30 dark:bg-amber-400/15 dark:text-amber-300 dark:ring-amber-400/30",
  },
  recruit: {
    icon: Users,
    short: "구인",
    soft: "bg-rose-100",
    fg: "text-rose-700",
    ring: "hover:border-rose-300",
    band: "from-rose-200/70 via-rose-100/40",
    badge:
      "bg-rose-500/12 text-rose-700 ring-rose-500/25 dark:bg-rose-400/15 dark:text-rose-300 dark:ring-rose-400/30",
  },
};

export const metaFor = (slug: string): Meta => CATEGORY_META[slug] ?? CATEGORY_META.riftbound;

/** 게시판 배지 — 미니 아이콘 + 라운드 pill + 컬러 링 (라이트/다크 대응). */
export function CategoryBadge({
  slug,
  label,
  className = "",
  showIcon = true,
}: {
  slug: CommunityCategory | string;
  label?: string;
  className?: string;
  showIcon?: boolean;
}) {
  const m = metaFor(slug);
  const Icon = m.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-1.5 py-[3px] text-[11px] font-bold leading-none ring-1 ring-inset",
        m.badge,
        className,
      )}
    >
      {showIcon && <Icon className="h-[11px] w-[11px]" strokeWidth={2.5} />}
      {label ?? m.short}
    </span>
  );
}
