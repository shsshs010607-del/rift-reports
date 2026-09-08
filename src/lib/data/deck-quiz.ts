import { TIER_DECKS } from "./tier-list";

/**
 * "내게 맞는 덱 유형" 테스트.
 *
 * ⚠️ 아래 문항·선택지·가중치·매핑은 전부 **임시 플레이스홀더**다.
 *    실제 내용은 따로 확정한 뒤 이 파일만 교체하면 된다 (컴포넌트 수정 불필요).
 */

export type QuizOption = {
  label: string;
  /** 아키타입별 가중치. */
  weights: Record<string, number>;
};

export type QuizQuestion = {
  id: string;
  question: string;
  options: QuizOption[];
};

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: "wincon",
    question: "게임을 어떤 방식으로 이기고 싶나요?",
    options: [
      { label: "초반부터 빠르게 몰아친다", weights: { aggro: 3, tempo: 1 } },
      { label: "자원을 쌓아 후반에 압도한다", weights: { control: 3, ramp: 2 } },
      { label: "콤보 한 방으로 끝낸다", weights: { combo: 3 } },
      { label: "상황에 맞춰 유연하게", weights: { midrange: 3, tempo: 1 } },
    ],
  },
  {
    id: "style",
    question: "선호하는 플레이 성향은?",
    options: [
      { label: "공격적으로 밀어붙인다", weights: { aggro: 2, tempo: 1 } },
      { label: "균형 있게 주고받는다", weights: { midrange: 2 } },
      { label: "수비적으로 버틴다", weights: { control: 2 } },
    ],
  },
  {
    id: "difficulty",
    question: "덱 조작 난이도는?",
    options: [
      { label: "쉽고 직관적인 게 좋다", weights: { aggro: 1, midrange: 1 } },
      { label: "적당한 판단이 필요한 정도", weights: { tempo: 1, ramp: 1 } },
      { label: "어려워도 파고들고 싶다", weights: { combo: 2, control: 1 } },
    ],
  },
];

/** 아키타입 → 대표 덱 id (TIER_DECKS). 임시 매핑. */
export const ARCHETYPE_DECK: Record<string, string> = {
  aggro: "darius",
  tempo: "yi",
  midrange: "sett",
  control: "viktor",
  ramp: "kaisa",
  combo: "yi",
};

export const ARCHETYPE_LABEL: Record<string, string> = {
  aggro: "어그로 · 빠른 압박",
  tempo: "템포 · 주도권 싸움",
  midrange: "미드레인지 · 유연함",
  control: "컨트롤 · 후반 장악",
  ramp: "램프 · 자원 가속",
  combo: "콤보 · 연계 폭딜",
};

export type QuizResult = {
  archetype: string;
  archetypeLabel: string;
  deckId: string;
};

export function scoreQuiz(answers: (number | null)[]): QuizResult {
  const score: Record<string, number> = {};
  answers.forEach((optIdx, qi) => {
    if (optIdx == null) return;
    const opt = QUIZ_QUESTIONS[qi]?.options[optIdx];
    if (!opt) return;
    for (const [k, v] of Object.entries(opt.weights)) score[k] = (score[k] ?? 0) + v;
  });
  const archetype = Object.entries(score).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "midrange";
  const deckId = ARCHETYPE_DECK[archetype] ?? TIER_DECKS[0]?.id ?? "";
  return { archetype, archetypeLabel: ARCHETYPE_LABEL[archetype] ?? archetype, deckId };
}
