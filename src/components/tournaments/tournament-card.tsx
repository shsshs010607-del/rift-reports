import Link from "next/link";
import Image from "next/image";
import { CalendarDays, MapPin, Globe, Trophy, Star } from "lucide-react";
import type { Tournament } from "@/lib/types/database";
import { fmtKstShort } from "@/lib/datetime";
import { cn } from "@/lib/utils";

export const STATUS_LABEL: Record<Tournament["status"], string> = {
  upcoming: "예정",
  ongoing: "진행 중",
  finished: "종료",
};

export const CATEGORY_LABEL: Record<"official" | "shop" | "community", string> = {
  official: "공식",
  shop: "매장",
  community: "커뮤니티",
};

export const CATEGORY_STYLE: Record<"official" | "shop" | "community", string> = {
  official: "bg-primary text-white",
  shop: "bg-secondary-fixed text-on-secondary-fixed-variant",
  community: "bg-surface-container-high text-on-surface-variant",
};

export function categoryOf(t: Pick<Tournament, "category" | "organizer">): "official" | "shop" | "community" {
  if (t.category) return t.category;
  // 마이그레이션 전 폴백
  if (t.organizer && /라이엇|riot/i.test(t.organizer)) return "official";
  return "community";
}

/** playriftbound.com 등록 대회의 세부 종류(넥서스 나이트 / 오리진 스토어 예선). 해당 없으면 null. */
export const EVENT_TYPES = ["넥서스 나이트", "오리진 스토어 예선"] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export function eventTypeOf(t: Pick<Tournament, "name" | "format">): EventType | null {
  const hay = `${t.name} ${t.format ?? ""}`;
  if (hay.includes("스토어 예선")) return "오리진 스토어 예선";
  if (hay.includes("넥서스 나이트")) return "넥서스 나이트";
  return null;
}

const EVENT_TYPE_STYLE: Record<EventType, string> = {
  "넥서스 나이트": "bg-tertiary-fixed text-on-tertiary-fixed",
  "오리진 스토어 예선": "bg-amber-500 text-white",
};

const STATUS_STYLE: Record<Tournament["status"], string> = {
  upcoming: "bg-primary/10 text-primary-strong",
  ongoing: "bg-emerald/15 text-emerald",
  finished: "bg-subcanvas text-ink-soft",
};

export function TournamentCard({ t }: { t: Tournament }) {
  const eventType = eventTypeOf(t);
  // 오리진 스토어 예선은 상위 대회로 이어지는 예선이라 다른 대회보다 눈에 띄게 강조한다.
  const isOriginQualifier = eventType === "오리진 스토어 예선";
  return (
    <Link
      href={`/tournaments/${t.slug}`}
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-2xl border bg-card transition",
        isOriginQualifier
          ? "border-amber-500/60 shadow-[0_0_0_1px_rgba(245,158,11,0.15)] hover:border-amber-500"
          : "border-line/80 hover:border-primary/50",
      )}
    >
      <div className="relative aspect-[16/9] bg-subcanvas">
        {t.banner_url && (
          <Image
            src={t.banner_url}
            alt=""
            fill
            sizes="(max-width:640px) 100vw, 400px"
            className="object-cover transition group-hover:scale-[1.02]"
          />
        )}
        <div className="absolute left-3 top-3 flex gap-1.5">
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-label-sm font-bold",
              STATUS_STYLE[t.status],
            )}
          >
            {STATUS_LABEL[t.status]}
          </span>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-label-sm font-bold",
              CATEGORY_STYLE[categoryOf(t)],
            )}
          >
            {CATEGORY_LABEL[categoryOf(t)]}
          </span>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        {eventType && (
          <span
            className={cn(
              "inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-label-sm font-bold",
              EVENT_TYPE_STYLE[eventType],
            )}
          >
            {isOriginQualifier && <Star className="h-3 w-3 fill-current" />}
            {eventType}
          </span>
        )}
        <h2 className="font-display text-title-lg font-bold text-ink">{t.name}</h2>
        <div className="mt-auto flex flex-col gap-1 pt-1 text-body-sm text-ink-soft">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" />
            {fmtKstShort(t.starts_at)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            {t.is_online ? <Globe className="h-3.5 w-3.5" /> : <MapPin className="h-3.5 w-3.5" />}
            {t.is_online ? "온라인" : (t.location ?? "장소 미정")}
          </span>
          {t.prize_pool && (
            <span className="inline-flex items-center gap-1.5">
              <Trophy className="h-3.5 w-3.5" />
              {t.prize_pool}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
