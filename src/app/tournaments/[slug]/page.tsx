import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, CalendarDays, MapPin, Globe, Trophy, Users, ExternalLink } from "lucide-react";
import { getTournament } from "@/lib/queries";
import { fmtKstFull, fmtKstMonthDayTime } from "@/lib/datetime";
import {
  STATUS_LABEL,
  CATEGORY_LABEL,
  CATEGORY_STYLE,
  categoryOf,
} from "@/components/tournaments/tournament-card";
import { cn } from "@/lib/utils";

export const revalidate = 120;

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const t = await getTournament(params.slug);
  return t ? { title: t.name, description: t.description ?? undefined } : { title: "대회" };
}

function Row({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 text-body-md text-ink">
      <span className="mt-0.5 text-ink-soft">{icon}</span>
      <span>{children}</span>
    </div>
  );
}

export default async function TournamentDetailPage({ params }: { params: { slug: string } }) {
  const t = await getTournament(params.slug);
  if (!t) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/tournaments"
        className="mb-4 inline-flex items-center gap-1 text-body-sm text-ink-soft hover:text-primary-strong"
      >
        <ChevronLeft className="h-4 w-4" />
        대회 정보
      </Link>

      {t.banner_url && (
        <div className="relative mb-6 aspect-[16/9] overflow-hidden rounded-2xl bg-subcanvas">
          <Image src={t.banner_url} alt="" fill sizes="768px" className="object-cover" priority />
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        <span className="chip">{STATUS_LABEL[t.status]}</span>
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2.5 py-1 text-body-sm font-bold",
            CATEGORY_STYLE[categoryOf(t)],
          )}
        >
          {CATEGORY_LABEL[categoryOf(t)]} 대회
        </span>
      </div>
      <h1 className="mt-2 font-display text-headline-lg text-ink">{t.name}</h1>

      <div className="mt-5 flex flex-col gap-2 rounded-2xl border border-line/80 bg-card p-4">
        <Row icon={<CalendarDays className="h-4 w-4" />}>
          {fmtKstFull(t.starts_at)}
          {t.ends_at && ` ~ ${fmtKstMonthDayTime(t.ends_at)}`}
        </Row>
        <Row icon={t.is_online ? <Globe className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}>
          {t.is_online ? "온라인 진행" : (t.location ?? "장소 미정")}
        </Row>
        {t.format && <Row icon={<Users className="h-4 w-4" />}>{t.format}</Row>}
        {t.prize_pool && <Row icon={<Trophy className="h-4 w-4" />}>{t.prize_pool}</Row>}
        {t.organizer && (
          <Row icon={<Users className="h-4 w-4" />}>주최: {t.organizer}</Row>
        )}
      </div>

      {t.description && (
        <div className="mt-6 whitespace-pre-wrap text-body-lg leading-relaxed text-ink">
          {t.description}
        </div>
      )}

      {t.registration_url && t.status !== "finished" && (
        <a
          href={t.registration_url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary mt-6"
        >
          <ExternalLink className="h-4 w-4" />
          참가 신청
        </a>
      )}
    </div>
  );
}
