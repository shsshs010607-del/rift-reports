import { MessageCircle, Newspaper, Layers, Trophy, Users } from "lucide-react";
import type { CommunityCategory } from "@/lib/types/database";

type Meta = {
  icon: typeof MessageCircle;
  /** 배지용 짧은 이름 */
  short: string;
  /** 아이콘/배지 배경 */
  soft: string;
  /** 아이콘/텍스트 색 */
  fg: string;
  /** 카드 호버 링 */
  ring: string;
};

export const CATEGORY_META: Record<string, Meta> = {
  riftbound: {
    icon: MessageCircle,
    short: "자유",
    soft: "bg-violet-100",
    fg: "text-violet-700",
    ring: "hover:border-violet-300",
  },
  report: {
    icon: Newspaper,
    short: "리포트",
    soft: "bg-sky-100",
    fg: "text-sky-700",
    ring: "hover:border-sky-300",
  },
  "deck-guide": {
    icon: Layers,
    short: "덱공략",
    soft: "bg-green-100",
    fg: "text-green-700",
    ring: "hover:border-green-300",
  },
  tournament: {
    icon: Trophy,
    short: "대회",
    soft: "bg-yellow-100",
    fg: "text-yellow-800",
    ring: "hover:border-yellow-300",
  },
  recruit: {
    icon: Users,
    short: "구인",
    soft: "bg-rose-100",
    fg: "text-rose-700",
    ring: "hover:border-rose-300",
  },
};

export const metaFor = (slug: string): Meta => CATEGORY_META[slug] ?? CATEGORY_META.riftbound;

/** 소프트 톤 카테고리 배지 (짧은 이름) */
export function CategoryBadge({
  slug,
  label,
  className = "",
}: {
  slug: CommunityCategory | string;
  /** 미지정 시 meta.short 사용 */
  label?: string;
  className?: string;
}) {
  const m = metaFor(slug);
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-bold ${m.soft} ${m.fg} ${className}`}
    >
      {label ?? m.short}
    </span>
  );
}
