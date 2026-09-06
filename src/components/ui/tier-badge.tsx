import { TIER_STYLES } from "@/lib/constants";
import type { Tier } from "@/lib/types/database";
import { cn } from "@/lib/utils";

export function TierBadge({ tier, className }: { tier: Tier; className?: string }) {
  const s = TIER_STYLES[tier];
  return <span className={cn(s.badge, className)}>{s.label}</span>;
}

/** 티어리스트 보드의 좌측 고정 레터 뱃지 (80px) */
export function TierHeader({ tier }: { tier: Tier }) {
  const s = TIER_STYLES[tier];
  return (
    <div
      className={cn(
        "grid h-full min-h-[72px] w-14 shrink-0 place-items-center rounded-xl font-display text-headline-md font-extrabold text-white sm:w-20",
        s.headerBg,
      )}
    >
      {s.label}
    </div>
  );
}
