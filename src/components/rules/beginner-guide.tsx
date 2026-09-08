import Link from "next/link";
import { Trophy, Package, Lightbulb, ShoppingCart } from "lucide-react";
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
import type { Card } from "@/lib/types/card";
import { LocalizedCard } from "@/components/cards/localized-card";
import { TurnPhases } from "./turn-phases";

/** 6개 도메인의 플레이 성향 (색 파이 기준 요약) */
const DOMAIN_TRAITS: Record<string, string> = {
  fury: "공격적·즉발. 빠른 유닛, 직접 피해, 위력 폭발. 짧게 끝내는 어그로.",
  calm: "성장·자원. 에너지 가속, 큰 유닛, 회복. 판을 키우는 장기전.",
  mind: "정보·카드 이득. 드로우, 통찰/예측, 반응. 상대를 읽는 컨트롤.",
  body: "전투·거점. 이동, 점령, 방패. 전장을 몸으로 밀어붙이는 압박.",
  chaos: "변칙·확률. 무작위 효과, 자기 희생, 판을 흔드는 고위험 고수익.",
  order: "규율·군단. 토큰 소환, 광역 버프, 진형. 수로 밀어붙이는 물량.",
};

/** 판 위(The Board) 구역 */
const BOARD_ZONES: { name: string; desc: string }[] = [
  {
    name: "베이스 (Base)",
    desc: "내 유닛·도구를 소환해 대기시키는 안전 구역. 전투가 없고, 상대는 여기 아무것도 둘 수 없다. 충전한 룬(룬 풀)도 여기 모인다.",
  },
  {
    name: "전장 존 (Battlefield Zone)",
    desc: "양쪽 플레이어가 공유하는 중앙. 여기 놓인 전장을 점령·유지해 점수를 얻는다. 1v1은 전장 2개(각자 덱의 전장 3장 중 1장씩 제공).",
  },
  {
    name: "전장 (Battlefield)",
    desc: "각각이 하나의 '위치'. 유닛을 베이스↔전장으로 이동시켜 지배권을 다툰다.",
  },
  {
    name: "페이스다운 존",
    desc: "각 전장에 딸린 숨김 칸. 그 전장을 지배하는 쪽만 카드 1장을 뒷면으로 숨길 수 있고, 지배권을 잃으면 사라진다.",
  },
  {
    name: "레전드 존",
    desc: "챔피언 레전드를 놓는 자리. 게임 내내 고정 — 이동·제거되지 않는다.",
  },
];

/** 판 밖(Non-Board) 구역 */
const OFF_BOARD_ZONES: { name: string; desc: string }[] = [
  { name: "챔피언 존", desc: "지정 챔피언이 시작하는 자리. 여기서 일반 카드처럼 플레이한다." },
  { name: "메인 덱 / 룬 덱", desc: "따로 셔플해 각자 자리에 뒷면으로 놓는다. 카드는 메인 덱, 자원(룬)은 룬 덱에서." },
  { name: "손패 (Hand)", desc: "드로우한 카드가 들어오는 곳. 나만 본다(비공개)." },
  { name: "트래시", desc: "처치·버림·사용된 카드가 가는 곳. 플레이어별로 따로 둔다." },
  { name: "추방 (Banishment)", desc: "추방 효과로 게임에서 빠진 카드. 트래시보다 되돌리기 어렵다." },
  { name: "체인 (Chain)", desc: "플레이한 카드·능력이 해결을 기다리며 쌓이는 곳. 나중 것부터 해결." },
];

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

/** 게임판 배치 도해 — 두 플레이어가 마주 앉고, 전장 존을 가운데 공유한다. */
function BoardDiagram() {
  const sub = "mt-0.5 block text-[10px] font-normal leading-tight text-ink-soft";
  const slot =
    "rounded-lg border border-line/70 bg-card px-2 py-2 text-center text-label-sm font-bold text-ink";
  return (
    <div className="surface p-5">
      <p className="mb-3 text-body-sm text-ink-soft">
        두 사람이 마주 앉고, <b className="text-ink">전장 존</b>을 가운데에 함께 놓습니다. 그 위아래로 각자
        자기 구역을 펼칩니다. (아래는 내 시점)
      </p>

      <div className="mx-auto max-w-md space-y-2">
        {/* 상대 진영 */}
        <div className="rounded-lg border border-dashed border-line/70 bg-subcanvas/40 px-3 py-2 text-center text-label-sm text-ink-soft">
          상대 진영
          <span className={sub}>상대 레전드 존 · 챔피언 존 · 베이스 · 메인/룬 덱 · 트래시</span>
        </div>

        {/* 전장 존 (공유) */}
        <div className="rounded-xl border-2 border-primary/40 bg-primary/[0.06] p-2.5">
          <p className="mb-2 text-center text-label-sm font-bold text-primary-strong">
            ⚔ 전장 존 · 양쪽 공유 (1v1 = 2개)
          </p>
          <div className="grid grid-cols-2 gap-2">
            {["전장 A", "전장 B"].map((b) => (
              <div
                key={b}
                className="rounded-lg border border-primary/30 bg-card px-2 py-3 text-center"
              >
                <span className="text-label-sm font-bold text-ink">{b}</span>
                <span className={sub}>점령·전투 · 페이스다운 칸 1</span>
              </div>
            ))}
          </div>
        </div>

        {/* 내 베이스 */}
        <div className="rounded-xl border-2 border-emerald/40 bg-emerald/[0.06] px-3 py-2.5 text-center">
          <span className="text-label-sm font-bold text-emerald">🟢 내 베이스 (Base)</span>
          <span className={sub}>
            유닛·도구 소환·대기 (안전, 전투 없음) · 룬 풀 — 충전한 룬 에너지·파워가 여기 모임
          </span>
        </div>

        {/* 내 판 밖 구역 */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <div className={slot}>
            레전드 존<span className={sub}>레전드 고정</span>
          </div>
          <div className={slot}>
            챔피언 존<span className={sub}>지정 챔피언 시작</span>
          </div>
          <div className={slot}>
            덱 · 트래시<span className={sub}>메인/룬 덱 · 추방 · 손패</span>
          </div>
        </div>
      </div>

      <div className="mt-5 border-t border-line/60 pt-4">
        <p className="mb-2 text-label-md font-bold text-ink">판 위 (The Board)</p>
        <ul className="grid gap-1.5 sm:grid-cols-2">
          {BOARD_ZONES.map((z) => (
            <li key={z.name} className="text-body-sm">
              <span className="font-bold text-ink">{z.name}</span>
              <span className="text-ink-soft"> — {z.desc}</span>
            </li>
          ))}
        </ul>
        <p className="mb-2 mt-4 text-label-md font-bold text-ink">판 밖 (Non-Board)</p>
        <ul className="grid gap-1.5 sm:grid-cols-2">
          {OFF_BOARD_ZONES.map((z) => (
            <li key={z.name} className="text-body-sm">
              <span className="font-bold text-ink">{z.name}</span>
              <span className="text-ink-soft"> — {z.desc}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** 자원 설명 — 실제 카드 한 장을 보며 부위별로 */
function ResourceGuide({ card }: { card: Card | null }) {
  return (
    <div className="surface p-5">
      <p className="mb-4 text-body-md text-ink-soft">{RESOURCES_SECTION.intro}</p>

      <div className="grid gap-5 sm:grid-cols-[180px_1fr]">
        {card && (
          <div className="mx-auto w-full max-w-[180px]">
            <LocalizedCard card={card} sizes="180px" />
            <p className="mt-1.5 text-center text-label-sm text-ink-soft">
              예시: {card.name}
              {typeof card.cost === "number" && ` · 비용 ${card.cost}`}
            </p>
          </div>
        )}

        <div className="flex flex-col gap-4">
          {RESOURCES_SECTION.steps.map((s) => (
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

      <p className="mt-4 rounded-xl bg-subcanvas/60 px-3.5 py-2.5 text-body-sm text-ink-soft">
        카드 <b className="text-ink">왼쪽 위 숫자</b> = 에너지 비용, 그 <b className="text-ink">아래 색 기호</b> = 파워
        비용, <b className="text-ink">오른쪽 아래</b> = 도메인.
      </p>
    </div>
  );
}

export function BeginnerGuide({ exampleCard = null }: { exampleCard?: Card | null }) {
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
          <li className="flex items-center justify-between gap-3 rounded-xl border-2 border-dashed border-primary/30 bg-primary/[0.04] p-4">
            <div>
              <p className="text-title-md font-bold text-primary-strong">카드 사러 가기</p>
              <p className="text-body-sm text-ink-soft">리프트바운드 취급 카드샵 찾기</p>
            </div>
            <Link
              href="/shops"
              className="shrink-0 rounded-full bg-primary px-4 py-2 text-label-md font-bold text-white transition hover:bg-primary-container"
            >
              <ShoppingCart className="mr-1 inline h-4 w-4" />
              매장
            </Link>
          </li>
        </ul>
      </Block>

      <Block id="domains" title="6개 도메인">
        <div className="grid gap-3 sm:grid-cols-2">
          {CARD_DOMAINS.map((d) => (
            <div key={d.slug} className="surface flex gap-3 overflow-hidden p-0">
              <span className="w-1.5 shrink-0" style={{ backgroundColor: d.color }} />
              <div className="flex gap-3 py-3.5 pr-4">
                <span
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-label-md font-extrabold text-white"
                  style={{ backgroundColor: d.color }}
                >
                  {d.short}
                </span>
                <div>
                  <p className="text-title-md text-ink">
                    {d.label} <span className="text-body-sm text-ink-soft">· {d.en}</span>
                  </p>
                  <p className="mt-0.5 text-body-sm text-ink-soft">{DOMAIN_TRAITS[d.slug]}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Block>

      <Block id="zones" title="게임판 구역 — 카드를 어디에 놓나">
        <BoardDiagram />
      </Block>

      <Block id="setup" title="게임 준비 — 한눈에">
        <ol className="surface flex flex-col gap-0 divide-y divide-line/50 p-0">
          {SETUP_SECTION.steps.map((s, i) => (
            <li key={s.title} className="flex gap-3 p-3.5">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary text-label-sm font-bold text-white">
                {i + 1}
              </span>
              <div>
                <p className="text-body-md font-bold text-ink">{s.title.replace(/^\d+\.\s*/, "")}</p>
                <p className="text-body-sm text-ink-soft">{s.body}</p>
                {s.tip && (
                  <p className="mt-0.5 flex gap-1 text-body-sm text-primary-strong">
                    <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    {s.tip}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
      </Block>

      <Block id="turn" title="턴 순서">
        <TurnPhases />
      </Block>

      <Block id="resources" title={RESOURCES_SECTION.title}>
        <ResourceGuide card={exampleCard} />
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
