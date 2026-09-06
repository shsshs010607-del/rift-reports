import Link from "next/link";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { CalendarDays, MapPin, Globe } from "lucide-react";
import { SectionHeader, EmptyState } from "@/components/ui/section-header";
import { TOURNAMENT_STATUS } from "@/lib/constants";
import type { Tournament } from "@/lib/types/database";

const statusStyle: Record<string, string> = {
  upcoming: "bg-primary-wash text-primary-strong",
  ongoing: "bg-emerald/10 text-[#047857]",
  finished: "bg-tier-c/10 text-ink-soft",
};
const statusLabel = (s: string) => TOURNAMENT_STATUS.find((x) => x.slug === s)?.label ?? s;

export function TournamentPreview({ tournaments }: { tournaments: Tournament[] }) {
  return (
    <section>
      <SectionHeader title="대회 일정" description="진행 예정 · 진행 중" href="/tournaments" />
      {tournaments.length === 0 ? (
        <EmptyState message="예정된 대회가 없습니다." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tournaments.map((t) => (
            <Link key={t.id} href={`/tournaments/${t.slug}`} className="surface surface-hover flex flex-col gap-3 p-4">
              <div className="flex items-center justify-between">
                <span className={`rounded-full px-2.5 py-1 text-label-sm uppercase ${statusStyle[t.status]}`}>
                  {statusLabel(t.status)}
                </span>
                {t.is_online ? (
                  <Globe className="h-4 w-4 text-ink-soft" />
                ) : (
                  <MapPin className="h-4 w-4 text-ink-soft" />
                )}
              </div>
              <h3 className="font-display text-title-md text-ink">{t.name}</h3>
              <div className="mt-auto flex items-center gap-1.5 text-body-sm text-ink-soft">
                <CalendarDays className="h-4 w-4" />
                {format(new Date(t.starts_at), "M월 d일 (EEE) HH:mm", { locale: ko })}
              </div>
              {t.location && <p className="text-body-sm text-ink-soft">{t.location}</p>}
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
