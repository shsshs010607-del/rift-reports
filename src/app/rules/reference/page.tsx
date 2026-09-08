import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, ArrowLeft } from "lucide-react";

import { PageHeading } from "@/components/ui/page-heading";
import { GLOSSARY } from "@/content/glossary";

export const metadata: Metadata = {
  title: "상세 룰",
  description:
    "리프트바운드 상세 룰 빠른 참조 — 턴 페이즈, 존, 자원, 전투·점수, 키워드. 공식 Core Rules 링크 포함.",
};

const CORE_RULES_PDF =
  "https://cmsassets.rgpub.io/sanity/files/dsfx7636/news_live/572377fcaa704a05f72eb42c104079d3b3bcf740.pdf";

const PHASES: [string, string][] = [
  ["각성 (Awaken)", "내 카드·룬을 모두 준비 상태로. 지속 효과 갱신."],
  ["시작 (Beginning)", "'유지(Hold)' 점수 — 내가 조종 중인 전장 1개당 1점."],
  ["충전 (Channeling)", "룬 덱에서 룬 2장을 보드로 충전(12장 채우면 종료)."],
  ["드로우 (Draw)", "메인 덱에서 1장. (덱이 비면 탈진 Burn Out)"],
  ["행동 (Action)", "우선권을 주고받으며 카드·능력 플레이, 이동, 전투·결투."],
  ["종료 (Ending)", "모든 데미지 회복, 만료 효과 정리, 룬 풀 비움."],
];

const ZONES_BOARD: [string, string][] = [
  ["베이스 (Base)", "플레이어마다 하나. 유닛·도구를 항상 낼 수 있는 자기 위치. 룬도 여기."],
  ["전장 존 (Battlefield Zone)", "가운데 공유 구역. 1v1은 전장 2개(덱의 전장 3장 중 세팅 때 1장 선택)."],
  ["전장 (Battlefield)", "점수를 얻는 목표 지점. 지배권을 두고 다툼."],
  ["레전드 존 (Legend Zone)", "챔피언 레전드가 게임 내내 고정(이동·제거 불가)."],
  ["페이스다운 존 (Facedown Zone)", "각 전장에 딸린 하위 공간. 숨겨진(Hidden) 카드 최대 1장."],
];

const ZONES_OFF: [string, string][] = [
  ["챔피언 존 (Champion Zone)", "지정 챔피언이 게임 시작 시 놓이는 곳. 일반 카드처럼 플레이 가능."],
  ["메인 덱 / 룬 덱", "메인 39~59장(이름당 3장) · 룬 정확히 12장. 분리해 셔플."],
  ["손패 (Hand)", "상한 없음. 일부 효과가 상한을 만든다."],
  ["트래시 (Trash)", "처치·버림·소모 카드. 공개 정보. 탈진 시 덱으로 재활용."],
  ["추방 (Banishment)", "더 강하게 제거되거나 효과 처리 중 임시 보관. 공개 정보."],
  ["체인 (Chain)", "플레이/능력이 임시로 쌓이는 곳. 후입선출(LIFO)로 해결."],
];

const RESOURCES: [string, string, string][] = [
  ["에너지 (Energy)", "비용의 숫자", "룬을 지치게(exhaust) 해서 1 생성. 무색. 턴 끝 소멸."],
  ["파워 (Power)", "비용의 색 기호", "룬을 재활용(recycle)해서 그 도메인 파워 1 생성. 턴 끝 소멸."],
];

const COMBAT: [string, string][] = [
  ["결투 (Showdown)", "행동/반응을 번갈아 쓰는 창구. 모두 패스하면 종료."],
  ["전투 (Combat)", "서로 다른 두 플레이어의 유닛이 같은 전장에 있을 때 발생."],
  ["데미지 → 처치", "쌓인 데미지가 위력(Might) 이상이면 처치. 전투·턴 종료 시 회복."],
  ["점령 (Conquer)", "이번 턴 점수화 안 한, 조종 안 하던 전장의 지배권을 새로 얻으면 1점."],
  ["유지 (Hold)", "내 턴 시작 시 조종 중인 전장 1개당 1점."],
  ["승리", "먼저 8점(2v2는 11점). 마지막 결정타 점수는 조건부."],
];

export default function RulesReferencePage() {
  const keywords = GLOSSARY.filter((t) => t.category === "키워드");

  return (
    <div>
      <Link
        href="/rules"
        className="mb-3 inline-flex items-center gap-1 text-body-sm text-ink-soft hover:text-primary-strong"
      >
        <ArrowLeft className="h-4 w-4" />
        초보자 가이드
      </Link>

      <PageHeading
        title="상세 룰"
        description="자주 찾는 규칙 빠른 참조. 정확한 판정은 공식 Core Rules 를 따르세요."
      />

      <a
        href={CORE_RULES_PDF}
        target="_blank"
        rel="noopener noreferrer"
        className="mb-8 flex items-center gap-3 rounded-2xl border border-primary/25 bg-primary-wash/60 p-4 transition hover:bg-primary-wash"
      >
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-white">
          <ExternalLink className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-body-md font-bold text-ink">
            공식 Core Rules (PDF · 영문)
          </span>
          <span className="block text-body-sm text-ink-soft">
            Riot Games · 2025-12-01 개정 · 82페이지
          </span>
        </span>
      </a>

      <div className="flex flex-col gap-8">
        <Section title="턴 진행 (6 페이즈)">
          <Table rows={PHASES} head={["페이즈", "하는 일"]} />
        </Section>

        <Section title="자원">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-body-sm">
              <thead>
                <tr className="border-b border-line text-left text-label-sm uppercase tracking-wide text-ink-soft">
                  <th className="py-2 pr-3">자원</th>
                  <th className="py-2 pr-3">내는 것</th>
                  <th className="py-2">만드는 법</th>
                </tr>
              </thead>
              <tbody>
                {RESOURCES.map(([a, b, c]) => (
                  <tr key={a} className="border-b border-line/50 align-top">
                    <td className="py-2 pr-3 font-bold text-ink">{a}</td>
                    <td className="py-2 pr-3 text-ink">{b}</td>
                    <td className="py-2 text-ink-soft">{c}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-body-sm text-ink-soft">
            룬 풀(만들어 둔 자원)은 드로우 페이즈 끝과 턴 종료(만료)에 비워집니다.
          </p>
        </Section>

        <Section title="전투 · 점수">
          <Table rows={COMBAT} head={["개념", "설명"]} />
        </Section>

        <Section title="판 위 (The Board)">
          <Table rows={ZONES_BOARD} head={["존", "설명"]} />
        </Section>

        <Section title="판 밖 (Non-Board)">
          <Table rows={ZONES_OFF} head={["존", "설명"]} />
        </Section>

        <Section title="키워드">
          <ul className="grid gap-2 sm:grid-cols-2">
            {keywords.map((k) => (
              <li
                key={k.en}
                className="rounded-xl border border-line/70 bg-card p-3 text-body-sm"
              >
                <p className="font-bold text-ink">
                  {k.term}
                  <span className="ml-1.5 font-normal text-ink-soft">{k.en}</span>
                </p>
                <p className="mt-0.5 text-ink-soft">{k.definition}</p>
              </li>
            ))}
          </ul>
          <Link
            href="/glossary"
            className="mt-3 inline-flex items-center gap-1.5 text-label-md font-bold text-primary-strong hover:underline"
          >
            전체 용어 사전 →
          </Link>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="section-title mb-3">{title}</h2>
      {children}
    </section>
  );
}

function Table({ rows, head }: { rows: [string, string][]; head: [string, string] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-body-sm">
        <thead>
          <tr className="border-b border-line text-left text-label-sm uppercase tracking-wide text-ink-soft">
            <th className="w-1/3 py-2 pr-3">{head[0]}</th>
            <th className="py-2">{head[1]}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([a, b]) => (
            <tr key={a} className="border-b border-line/50 align-top">
              <td className="py-2 pr-3 font-bold text-ink">{a}</td>
              <td className="py-2 text-ink-soft">{b}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
