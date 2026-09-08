"use client";

import { useMemo, useState } from "react";

import type { Tournament } from "@/lib/types/database";
import { KR_SIDO } from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  TournamentCard,
  STATUS_LABEL,
  CATEGORY_LABEL,
  categoryOf,
} from "@/components/tournaments/tournament-card";
import { TournamentCalendar } from "@/components/tournaments/tournament-calendar";

const STATUS_ORDER: Tournament["status"][] = ["ongoing", "upcoming", "finished"];
const CATEGORIES = ["all", "official", "shop", "community"] as const;
type Cat = (typeof CATEGORIES)[number];

function regionOf(t: Tournament): string {
  if (t.is_online) return "온라인";
  const hit = KR_SIDO.find((s) => t.location?.includes(s));
  return hit ?? "기타";
}

export function TournamentsView({ tournaments }: { tournaments: Tournament[] }) {
  const [cat, setCat] = useState<Cat>("all");
  const [region, setRegion] = useState<string>("all");

  const regions = useMemo(() => {
    const set = new Set(tournaments.map(regionOf));
    // 시/도 순서 유지 + 온라인/기타는 뒤로
    const ordered = [
      ...KR_SIDO.filter((s) => set.has(s)),
      ...["온라인", "기타"].filter((s) => set.has(s)),
    ];
    return ordered;
  }, [tournaments]);

  const filtered = useMemo(
    () =>
      tournaments.filter(
        (t) =>
          (cat === "all" || categoryOf(t) === cat) &&
          (region === "all" || regionOf(t) === region),
      ),
    [tournaments, cat, region],
  );

  const groups = STATUS_ORDER.map((status) => ({
    status,
    items: filtered.filter((t) => t.status === status),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="flex flex-col gap-8">
      {/* 필터 */}
      <div className="flex flex-col gap-2.5 rounded-2xl border border-line/70 bg-card p-3.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-label-sm font-bold text-ink-soft">유형</span>
          {CATEGORIES.map((c) => (
            <Chip key={c} on={cat === c} onClick={() => setCat(c)}>
              {c === "all" ? "전체" : CATEGORY_LABEL[c]}
            </Chip>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-label-sm font-bold text-ink-soft">지역</span>
          <Chip on={region === "all"} onClick={() => setRegion("all")}>
            전체
          </Chip>
          {regions.map((r) => (
            <Chip key={r} on={region === r} onClick={() => setRegion(r)}>
              {r}
            </Chip>
          ))}
        </div>
      </div>

      <section>
        <h2 className="section-title mb-3">달력</h2>
        <TournamentCalendar tournaments={filtered} />
      </section>

      {groups.length === 0 ? (
        <p className="rounded-2xl border border-line bg-card p-10 text-center text-body-md text-ink-soft">
          조건에 맞는 대회가 없습니다.
        </p>
      ) : (
        groups.map((g) => (
          <section key={g.status}>
            <h2 className="section-title mb-3">
              {STATUS_LABEL[g.status]}
              <span className="ml-2 text-body-sm font-normal text-ink-soft">{g.items.length}</span>
            </h2>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {g.items.map((t) => (
                <li key={t.id}>
                  <TournamentCard t={t} />
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}

function Chip({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-1 text-label-sm font-bold transition",
        on ? "bg-primary text-white shadow-sm" : "bg-subcanvas text-ink-soft hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}
