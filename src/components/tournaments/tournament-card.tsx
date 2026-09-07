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
        <span
          className={cn(
            "absolute left-3 top-3 rounded-full px-2 py-0.5 text-label-sm font-bold",
            STATUS_STYLE[t.status],
          )}
        >
          {STATUS_LABEL[t.status]}
        </span>
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
