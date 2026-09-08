import { TIER_DECKS } from "./tier-list";

/**
 * "내게 맞는 덱 유형" 테스트.
 *
 * 성격/성향을 묻는 문항 → 덱별 가중치를 합산 → 상위 덱 추천.
 * 15개 정규 덱(+럭스)이 모두 결과로 나올 수 있게 배분돼 있다.
 * 문항·가중치는 이 파일만 고치면 되고 컴포넌트 수정은 불필요하다.
 */

export type QuizOption = {
  label: string;
  /** 덱 id(TIER_DECKS.id)별 가중치. */
  weights: Record<string, number>;
};

export type QuizQuestion = {
  id: string;
  question: string;
  options: QuizOption[];
};

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: "vibe",
    question: "친구들이랑 같이 게임할 때, 나는 보통…",
    options: [
      {
        label: "검증된 세팅으로 안정적으로 간다",
        weights: { yi: 2, kaisa: 2, viktor: 2, garen: 1 },
      },
      {
        label: "남들 안 쓰는 특이한 걸 굴려본다",
        weights: { yasuo: 2, jinx: 2, teemo: 2, leesin: 1, ahri: 1 },
      },
      {
        label: "느긋하게 판을 깔고 뒷심으로 이긴다",
        weights: { mf: 2, leona: 2, lux: 1 },
      },
      {
        label: "일단 선빵, 기세로 몰아붙인다",
        weights: { yi: 1, darius: 2, yasuo: 1, sett: 1, annie: 1 },
      },
    ],
  },
  {
    id: "solve",
    question: "게임 안에서 문제를 푸는 방식은?",
    options: [
      {
        label: "힘으로 정면돌파",
        weights: { volibear: 2, garen: 2, sett: 2, mf: 1, leesin: 1, darius: 1 },
      },
      {
        label: "머리 굴려서 콤보·수 싸움",
        weights: { kaisa: 2, viktor: 2, ahri: 2, lux: 2, annie: 1 },
      },
      {
        label: "상대 실수를 기다렸다가 카운터",
        weights: { yasuo: 2, leona: 2, teemo: 2, mf: 1, jinx: 1 },
      },
    ],
  },
  {
    id: "losing",
    question: "지고 있을 때 나는?",
    options: [
      {
        label: "한 방 노리고 크게 던진다",
        weights: { jinx: 2, yasuo: 2, teemo: 1, ahri: 1 },
      },
      {
        label: "실수 없이 버티면서 기회를 본다",
        weights: { leona: 2, mf: 2, lux: 1 },
      },
      {
        label: "그냥 더 세게 밀어붙인다",
        weights: { darius: 2, yi: 1, sett: 1, garen: 1, volibear: 1 },
      },
      {
        label: "자원 모아서 후반에 뒤집는다",
        weights: { kaisa: 2, viktor: 2, lux: 1 },
      },
    ],
  },
  {
    id: "wincon",
    question: "가장 짜릿한 승리 방식은?",
    options: [
      {
        label: "커다란 유닛으로 짓밟기",
        weights: { volibear: 2, garen: 2, sett: 2, leesin: 2 },
      },
      {
        label: "주문 연타로 순식간에 정리",
        weights: { viktor: 2, ahri: 2, annie: 2, lux: 2 },
      },
      {
        label: "빠른 연계로 순삭 폭딜",
        weights: { yi: 2, kaisa: 2, jinx: 1 },
      },
      {
        label: "상대가 아무것도 못 하게 봉쇄",
        weights: { leona: 2, mf: 2, teemo: 2 },
      },
    ],
  },
  {
    id: "pick",
    question: "덱 고를 때 가장 끌리는 포인트는?",
    options: [
      { label: "티어 높고 안정적인 정석", weights: { yi: 2, kaisa: 2, viktor: 2 } },
      { label: "남들과 다른 개성", weights: { yasuo: 2, jinx: 2, teemo: 2 } },
      {
        label: "다루기 쉽고 배우기 편함",
        weights: { garen: 3, darius: 1, annie: 1 },
      },
      {
        label: "파고들수록 강해지는 고난도",
        weights: { leesin: 2, ahri: 2, viktor: 1, lux: 1, kaisa: 1 },
      },
    ],
  },
];

export type QuizResult = {
  /** 점수 높은 순 덱 id (최대 3개). */
  deckIds: string[];
};

export function scoreQuiz(answers: (number | null)[]): QuizResult {
  const score: Record<string, number> = {};
  answers.forEach((optIdx, qi) => {
    if (optIdx == null) return;
    const opt = QUIZ_QUESTIONS[qi]?.options[optIdx];
    if (!opt) return;
    for (const [k, v] of Object.entries(opt.weights)) score[k] = (score[k] ?? 0) + v;
  });

  const ranked = Object.entries(score)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([k]) => k);

  return { deckIds: ranked.length ? ranked.slice(0, 3) : [TIER_DECKS[0]?.id ?? ""] };
}
