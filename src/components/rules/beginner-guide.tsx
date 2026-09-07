import { Trophy, Package, Lightbulb, LayoutGrid } from "lucide-react";
import {
  GAME_GOAL,
  COMPONENTS,
  SETUP_SECTION,
  RESOURCES_SECTION,
  COMBAT_SECTION,
  SCORING_SECTION,
  FIRST_GAME_TIPS,
  type GuideSection,
} from "@/content/beginner-guide";
import { CARD_DOMAINS } from "@/lib/constants";
import { TurnPhases } from "./turn-phases";

function StepList({ section }: { section: GuideSection }) {
  return (
    <div className="surface p-5">
      {section.intro && <p className="mb-4 text-body-md text-ink-soft">{section.intro}</p>}
      <div className="flex flex-col gap-4">
        {section.steps.map((s) => (
          <div key={s.title} className="border-l-2 border-primary/30 pl-4">
            <h4 className="font-display text-title-md text-ink">{s.title}</h4>
            <p className="mt-0.5 text-body-md text-ink-soft">{s.body}</p>
            {s.tip && (
              <p className="mt-1.5 flex gap-1.5 text-body-sm text-primary-strong">
                <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {s.tip}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const ZONES: { name: string; en: string; desc: string }[] = [
  {
    name: "레전드 존",
    en: "Legend Zone",
    desc: "챔피언 레전드를 놓는 자리. 게임 내내 여기 고정되며 이동하지 않는다.",
  },
  {
    name: "챔피언 존",
    en: "Champion Zone",
    desc: "지정 챔피언이 게임 시작 시 놓이는 자리. 여기서 일반 카드처럼 플레이한다.",
  },
  {
    name: "본대",
    en: "Base",
    desc: "내 유닛이 소환되어 대기하는 안전 구역. 전투가 벌어지지 않는다.",
  },
  {
    name: "전장 (3곳)",
    en: "Battlefield",
    desc: "거점 점령과 전투가 벌어지는 곳. 유닛을 이동시켜 점령·유지로 점수를 얻는다.",
  },
  {
    name: "메인 덱 / 룬 덱",
    en: "Main Deck / Rune Deck",
    desc: "각각 따로 셔플해서 놓는다. 메인 덱에서 카드를, 룬 덱에서 자원(룬)을 뽑는다.",
  },
  {
    name: "룬 풀",
    en: "Rune Pool",
    desc: "룬을 재활용해 만든 파워가 모이는 곳. 매 라운드가 끝나면 비워진다.",
  },
  {
    name: "페이스다운 존",
    en: "Facedown Zone",
    desc: "각 전장에 딸린 공간. 그 전장을 지배하는 플레이어가 카드 1장을 뒷면으로 숨긴다(숨겨짐).",
  },
  {
    name: "체인",
    en: "Chain",
    desc: "플레이한 카드·활성화한 능력이 해결을 기다리며 잠시 쌓이는 곳. 나중에 올린 것부터 해결된다.",
  },
  {
    name: "트래시 / 추방",
    en: "Trash / Banishment",
    desc: "처치·사용된 카드는 트래시(묘지)로, 게임에서 완전히 빠지는 카드는 추방으로 간다.",
  },
];

function Block({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      <h3 className="mb-3 font-display text-headline-sm text-ink">{title}</h3>
      {children}
    </section>
  );
}

export function BeginnerGuide() {
  return (
    <div className="flex flex-col gap-10">
      <Block id="goal" title="게임 목표">
        <div className="surface flex items-start gap-4 p-5">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-amber/15 text-amber">
            <Trophy className="h-5 w-5" />
          </span>
          <div>
            <p className="font-display text-title-md text-ink">{GAME_GOAL.headline}</p>
            <p className="mt-1 text-body-md text-ink-soft">{GAME_GOAL.detail}</p>
          </div>
        </div>
      </Block>

      <Block id="components" title="준비물">
        <ul className="grid gap-3 sm:grid-cols-2">
          {COMPONENTS.map((c) => (
            <li key={c.name} className="surface flex gap-3 p-4">
              <Package className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div>
                <p className="text-title-md text-ink">{c.name}</p>
                <p className="text-body-sm text-ink-soft">{c.desc}</p>
              </div>
            </li>
          ))}
        </ul>
      </Block>

      <Block id="domains" title="6개 도메인">
        <div className="surface grid grid-cols-2 gap-3 p-5 sm:grid-cols-3">
          {CARD_DOMAINS.map((d) => (
            <div key={d.slug} className="flex items-center gap-2.5">
              <span
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-label-sm font-extrabold text-white"
                style={{ backgroundColor: d.color }}
              >
                {d.short}
              </span>
              <div className="leading-tight">
                <p className="text-title-md text-ink">{d.label}</p>
                <p className="text-body-sm text-ink-soft">{d.en}</p>
              </div>
            </div>
          ))}
        </div>
      </Block>

      <Block id="zones" title="게임판 구역 — 카드를 어디에 놓나">
        <div className="surface grid gap-3 p-5 sm:grid-cols-2">
          {ZONES.map((z) => (
            <div key={z.en} className="flex gap-3">
              <LayoutGrid className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div>
                <p className="text-title-md text-ink">
                  {z.name} <span className="text-body-sm text-ink-soft">· {z.en}</span>
                </p>
                <p className="text-body-sm text-ink-soft">{z.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Block>

      <Block id="setup" title={SETUP_SECTION.title}>
        <StepList section={SETUP_SECTION} />
      </Block>

      <Block id="turn" title="턴 순서">
        <TurnPhases />
      </Block>

      <Block id="resources" title={RESOURCES_SECTION.title}>
        <StepList section={RESOURCES_SECTION} />
      </Block>

      <Block id="combat" title={COMBAT_SECTION.title}>
        <StepList section={COMBAT_SECTION} />
      </Block>

      <Block id="scoring" title={SCORING_SECTION.title}>
        <StepList section={SCORING_SECTION} />
      </Block>

      <Block id="tips" title="첫 게임 팁">
        <ul className="surface flex flex-col gap-2 p-5">
          {FIRST_GAME_TIPS.map((t) => (
            <li key={t} className="flex gap-2 text-body-md text-ink-soft">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              {t}
            </li>
          ))}
        </ul>
      </Block>
    </div>
  );
}

export const GUIDE_TOC = [
  { id: "goal", label: "게임 목표" },
  { id: "components", label: "준비물" },
  { id: "domains", label: "6개 도메인" },
  { id: "zones", label: "게임판 구역" },
  { id: "setup", label: "게임 준비" },
  { id: "turn", label: "턴 순서" },
  { id: "resources", label: "자원" },
  { id: "combat", label: "이동·전투" },
  { id: "scoring", label: "점수" },
  { id: "tips", label: "첫 게임 팁" },
];
