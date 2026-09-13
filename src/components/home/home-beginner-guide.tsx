"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Trophy, Layers, Clock, Lightbulb, BookOpen } from "lucide-react";

import { cn } from "@/lib/utils";
import { CARD_DOMAINS } from "@/lib/constants";
import { GAME_GOAL, TURN_PHASES, FIRST_GAME_TIPS } from "@/content/beginner-guide";

/** 6개 도메인 플레이 성향 — 초보자 가이드 요약과 동일 문구(축약). */
const DOMAIN_TRAITS: Record<string, string> = {
  fury: "공격적·즉발. 빠르게 끝내는 어그로.",
  calm: "성장·자원. 판을 키우는 장기전.",
  mind: "정보·카드 이득. 상대를 읽는 컨트롤.",
  body: "전투·거점. 전장을 몸으로 미는 압박.",
  chaos: "변칙·확률. 고위험 고수익.",
  order: "규율·군단. 수로 밀어붙이는 물량.",
};

/** 판 위 구역 요약 — 전체 도해는 /rules 참고. */
const BOARD_ZONES_MINI: { name: string; desc: string }[] = [
  { name: "베이스", desc: "내 유닛·도구 대기. 전투 없는 안전 구역." },
  { name: "전장 존", desc: "양쪽이 공유. 점령·유지해 점수를 얻는다." },
  { name: "레전드 존", desc: "챔피언 레전드 고정 자리, 게임 내내 유지." },
  { name: "손패 / 트래시", desc: "드로우한 카드 · 처치·사용된 카드." },
];

const TABS = [
  { key: "goal", label: "게임 목표", icon: Trophy },
  { key: "domain", label: "6개 도메인", icon: Layers },
  { key: "board", label: "게임판", icon: BookOpen },
  { key: "turn", label: "턴 순서", icon: Clock },
  { key: "tips", label: "첫 게임 팁", icon: Lightbulb },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function HomeBeginnerGuide() {
  const [tab, setTab] = useState<TabKey>("goal");

  return (
    <section className="note-card p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-label-sm font-bold uppercase tracking-wide text-primary-strong">
            리프트바운드가 처음이신가요?
          </p>
          <h2 className="mt-0.5 font-display text-title-lg text-ink">초보자 가이드</h2>
        </div>
        <Link
          href="/rules"
          className="inline-flex shrink-0 items-center gap-1 text-label-md font-bold text-ink-soft transition hover:text-primary-strong"
        >
          전체 가이드 보기
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="flex flex-wrap gap-1 border-b border-line pb-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-label-md font-bold transition",
              tab === t.key
                ? "bg-primary text-white"
                : "text-ink-soft hover:bg-subcanvas hover:text-ink",
            )}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      <div className="pt-4">
        {tab === "goal" && (
          <div className="flex items-start gap-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-amber/15 text-amber">
              <Trophy className="h-5 w-5" />
            </span>
            <div>
              <p className="font-display text-title-md text-ink">{GAME_GOAL.headline}</p>
              <p className="mt-1 text-body-sm leading-snug text-ink-soft">{GAME_GOAL.detail}</p>
            </div>
          </div>
        )}

        {tab === "domain" && (
          <div className="grid gap-2 sm:grid-cols-2">
            {CARD_DOMAINS.map((d) => (
              <div key={d.slug} className="flex items-center gap-3 overflow-hidden rounded-xl border border-line/70 py-2.5 pl-0 pr-3">
                <span className="h-full w-1.5 shrink-0 self-stretch" style={{ backgroundColor: d.color }} />
                <span
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-label-sm font-extrabold text-white"
                  style={{ backgroundColor: d.color }}
                >
                  {d.short}
                </span>
                <div className="min-w-0">
                  <p className="text-label-md font-bold text-ink">
                    {d.label} <span className="text-body-sm font-normal text-ink-soft">· {d.en}</span>
                  </p>
                  <p className="truncate text-body-sm text-ink-soft">{DOMAIN_TRAITS[d.slug]}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "board" && (
          <div className="grid gap-2 sm:grid-cols-2">
            {BOARD_ZONES_MINI.map((z) => (
              <div key={z.name} className="rounded-xl border border-line/70 p-3">
                <p className="text-label-md font-bold text-ink">{z.name}</p>
                <p className="mt-0.5 text-body-sm text-ink-soft">{z.desc}</p>
              </div>
            ))}
          </div>
        )}

        {tab === "turn" && (
          <ol className="flex flex-col gap-0 divide-y divide-line/50">
            {TURN_PHASES.map((p, i) => (
              <li key={p.phase} className="flex gap-3 py-2.5 first:pt-0 last:pb-0">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary text-label-sm font-bold text-white">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-body-md font-bold text-ink">
                    {p.phase} <span className="text-body-sm font-normal text-ink-soft">· {p.short}</span>
                  </p>
                  <p className="mt-0.5 text-body-sm text-ink-soft">{p.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        )}

        {tab === "tips" && (
          <ul className="flex flex-col gap-2">
            {FIRST_GAME_TIPS.map((t) => (
              <li key={t} className="flex gap-2 text-body-md text-ink-soft">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                {t}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
