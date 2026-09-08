import Link from "next/link";
import Image from "next/image";
import { CalendarDays, MapPin, Globe, Trophy } from "lucide-react";
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

const STATUS_STYLE: Record<Tournament["status"], string> = {
  upcoming: "bg-primary/10 text-primary-strong",
  ongoing: "bg-emerald/15 text-emerald",
  finished: "bg-subcanvas text-ink-soft",
};

export function TournamentCard({ t }: { t: Tournament }) {
  return (
    <Link
      href={`/tournaments/${t.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line/80 bg-card transition hover:border-primary/50"
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
