import { Trophy, Package, Lightbulb } from "lucide-react";
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
  { id: "setup", label: "게임 준비" },
  { id: "turn", label: "턴 순서" },
  { id: "resources", label: "자원" },
  { id: "combat", label: "이동·전투" },
  { id: "scoring", label: "점수" },
  { id: "tips", label: "첫 게임 팁" },
];
