"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, MapPin, Globe, CalendarDays, Star } from "lucide-react";
import type { Tournament } from "@/lib/types/database";
import { fmtKstMonthDayTime, kstYmd } from "@/lib/datetime";
import {
  CATEGORY_LABEL,
  CATEGORY_STYLE,
  categoryOf,
  eventTypeOf,
} from "@/components/tournaments/tournament-card";
import { cn } from "@/lib/utils";

/** 오리진 스토어 예선 — 공식 경쟁 대회 상위 라운드로 이어지는 예선이라 다른 이벤트보다 눈에 띄게 강조한다. */
const isOriginQualifier = (t: Tournament) => eventTypeOf(t) === "오리진 스토어 예선";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const ymd = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
const ymdKst = (iso: string) => {
  const k = kstYmd(iso);
  return `${k.y}-${k.m - 1}-${k.d}`;
};

const fmtRange = (t: Tournament) => fmtKstMonthDayTime(t.starts_at);

export function TournamentCalendar({ tournaments }: { tournaments: Tournament[] }) {
  const today = new Date();
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState<string | null>(null);

  const byDay = useMemo(() => {
    const map = new Map<string, Tournament[]>();
    for (const t of tournaments) {
      const key = ymdKst(t.starts_at);
      const arr = map.get(key) ?? [];
      arr.push(t);
      map.set(key, arr);
    }
    return map;
  }, [tournaments]);

  const grid = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const first = new Date(year, month, 1);
    const start = new Date(first);
    start.setDate(1 - first.getDay());
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [cursor]);

  const monthLabel = cursor.toLocaleDateString("ko-KR", { year: "numeric", month: "long" });
  const inMonth = (d: Date) => d.getMonth() === cursor.getMonth();

  const monthEvents = useMemo(
    () =>
      tournaments
        .filter((t) => {
          const k = kstYmd(t.starts_at);
          return k.y === cursor.getFullYear() && k.m - 1 === cursor.getMonth();
        })
        .sort((a, b) => +new Date(a.starts_at) - +new Date(b.starts_at)),
    [tournaments, cursor],
  );

  const listed = selected ? (byDay.get(selected) ?? []) : monthEvents;

  return (
    <div className="overflow-hidden rounded-2xl border border-line/70 bg-card">
      <div className="flex items-center justify-between border-b border-line/60 px-3 py-2.5">
        <button
          type="button"
          onClick={() => {
            setSelected(null);
            setCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1));
          }}
          className="grid h-8 w-8 place-items-center rounded-full text-ink-soft hover:bg-subcanvas hover:text-ink"
          aria-label="이전 달"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="font-display text-title-md font-bold text-ink">{monthLabel}</span>
        <button
          type="button"
          onClick={() => {
            setSelected(null);
            setCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1));
          }}
          className="grid h-8 w-8 place-items-center rounded-full text-ink-soft hover:bg-subcanvas hover:text-ink"
          aria-label="다음 달"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 border-b border-line/40 text-center text-label-sm text-ink-soft">
        {WEEKDAYS.map((w, i) => (
          <div key={w} className={cn("py-1.5", i === 0 && "text-error", i === 6 && "text-primary-strong")}>
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {grid.map((d) => {
          const key = ymd(d);
          const evs = byDay.get(key) ?? [];
          const isToday = ymd(today) === key;
          const isSel = selected === key;
          return (
            <button
              key={key}
              type="button"
              disabled={evs.length === 0}
              onClick={() => setSelected(isSel ? null : key)}
              className={cn(
                "flex min-h-[52px] flex-col items-center gap-1 border-b border-r border-line/30 p-1.5 text-body-sm transition",
                !inMonth(d) && "text-ink-soft/40",
                inMonth(d) && "text-ink",
                evs.length > 0 && "cursor-pointer hover:bg-primary/5",
                isSel && "bg-primary/10",
              )}
            >
              <span
                className={cn(
                  "grid h-6 w-6 place-items-center rounded-full text-[13px]",
                  isToday && "bg-primary font-bold text-white",
                )}
              >
                {d.getDate()}
              </span>
              {evs.length > 0 && (
                <span className="flex gap-0.5">
                  {evs.slice(0, 3).map((e) => (
                    <span
                      key={e.id}
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        isOriginQualifier(e) ? "bg-amber-500" : "bg-primary",
                      )}
                    />
                  ))}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col">
        {listed.length === 0 ? (
          <p className="flex items-center justify-center gap-1.5 p-6 text-center text-body-sm text-ink-soft">
            <CalendarDays className="h-4 w-4" />
            {selected ? "이 날 예정된 대회가 없습니다." : "이번 달 예정된 대회가 없습니다."}
          </p>
        ) : (
          listed.map((t, i) => {
            // "전체"(날짜 미선택) 보기에서는 날짜가 바뀔 때만 굵은 구분선을 넣어
            // 같은 날 여러 대회와 다른 날 대회를 한눈에 구별할 수 있게 한다.
            const prev = listed[i - 1];
            const isNewDay = !selected && (!prev || ymdKst(t.starts_at) !== ymdKst(prev.starts_at));
            const originQualifier = isOriginQualifier(t);
            return (
              <Link
                key={t.id}
                href={`/tournaments/${t.slug}`}
                className={cn(
                  "flex items-start gap-3 p-3.5 hover:bg-subcanvas/50",
                  i > 0 && (isNewDay ? "border-t-2 border-line" : "border-t border-line/40"),
                  originQualifier && "bg-amber-500/5",
                )}
              >
                <div
                  className={cn(
                    "grid shrink-0 place-items-center rounded-lg px-2 py-1 text-center",
                    originQualifier ? "bg-amber-500/15" : "bg-primary/10",
                  )}
                >
                  <span
                    className={cn(
                      "text-label-sm font-bold",
                      originQualifier ? "text-amber-700 dark:text-amber-300" : "text-primary-strong",
                    )}
                  >
                    {kstYmd(t.starts_at).m}월
                  </span>
                  <span className="font-display text-title-md font-black leading-none text-ink">
                    {kstYmd(t.starts_at).d}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        "shrink-0 rounded px-1.5 py-0.5 text-[11px] font-bold",
                        CATEGORY_STYLE[categoryOf(t)],
                      )}
                    >
                      {CATEGORY_LABEL[categoryOf(t)]}
                    </span>
                    {originQualifier && (
                      <span className="inline-flex shrink-0 items-center gap-0.5 rounded bg-amber-500/15 px-1.5 py-0.5 text-[11px] font-bold text-amber-700 dark:text-amber-300">
                        <Star className="h-2.5 w-2.5 fill-current" />
                        오리진 스토어 예선
                      </span>
                    )}
                    <span className="truncate text-body-md font-bold text-ink">{t.name}</span>
                  </p>
                  <p className="mt-0.5 text-body-sm text-ink-soft">{fmtRange(t)}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-body-sm text-ink-soft">
                    {t.is_online ? (
                      <>
                        <Globe className="h-3.5 w-3.5" /> 온라인
                      </>
                    ) : (
                      <>
                        <MapPin className="h-3.5 w-3.5" /> {t.location ?? "장소 미정"}
                      </>
                    )}
                  </p>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
