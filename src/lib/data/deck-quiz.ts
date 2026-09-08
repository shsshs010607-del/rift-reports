import { TIER_DECKS } from "./tier-list";

/**
 * "내게 맞는 덱 유형" 테스트.
 *
 * 성격/성향을 묻는 7문항 → 덱별 가중치를 합산 → 상위 덱 추천.
 * 가중치는 대부분 1, 덱의 대표 성향에만 2. 15개 정규 덱(+럭스) 전부 결과로 나올 수 있다.
 * 문항·가중치는 이 파일만 고치면 되고 컴포넌트 수정은 불필요하다.
 *
 * 덱 성향 메모(가중치 근거):
 *  yi 빠름·연계폭딜   kaisa 후반성장·자원   viktor 주문램프·고난도   annie 분노번·화력
 *  sett 큰유닛·몸싸움  mf 광역·다수압박      yasuo 기절·반격콤보·변수  darius 어그로·출혈·처형
 *  volibear 큰유닛·지속전개  ahri 주문연계·매혹방해  leesin 킥콤보·이동·고난도  leona 방어·탱커·봉쇄
 *  jinx 폭딜피니시·한방  teemo 함정·견제·지속딜  garen 정직스탯·입문·쉬움  lux 빛주문·컨트롤·서포트
 */

export type QuizOption = {
  label: string;
  /** 덱 id(TIER_DECKS.id)별 가중치. 대표 성향만 2, 나머지 1. */
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
      { label: "검증된 세팅으로 안정적으로 간다", weights: { yi: 1, kaisa: 1, viktor: 1, garen: 1, sett: 1, volibear: 1 } },
      { label: "남들 안 쓰는 특이한 걸 굴려본다", weights: { yasuo: 2, jinx: 1, teemo: 1, leesin: 1, ahri: 1 } },
      { label: "느긋하게 판을 깔고 뒷심으로 이긴다", weights: { kaisa: 1, viktor: 1, leona: 2, lux: 1, teemo: 1, mf: 1 } },
      { label: "일단 선빵, 기세로 몰아붙인다", weights: { darius: 2, yi: 1, annie: 1, sett: 1 } },
    ],
  },
  {
    id: "solve",
    question: "게임 안에서 문제를 푸는 방식은?",
    options: [
      { label: "힘으로 정면돌파", weights: { volibear: 2, garen: 1, sett: 2, darius: 1, leesin: 1 } },
      { label: "머리 굴려서 콤보·수 싸움", weights: { viktor: 2, ahri: 2, lux: 2, yi: 1, yasuo: 1 } },
      { label: "상대 실수를 기다렸다가 카운터", weights: { yasuo: 1, leona: 2, teemo: 2, mf: 2, jinx: 1 } },
    ],
  },
  {
    id: "losing",
    question: "지고 있을 때 나는?",
    options: [
      { label: "한 방 노리고 크게 던진다", weights: { jinx: 2, yasuo: 1, teemo: 1, ahri: 1, annie: 1, mf: 1 } },
      { label: "실수 없이 버티면서 기회를 본다", weights: { leona: 2, mf: 1, lux: 1, teemo: 1 } },
      { label: "그냥 더 세게 밀어붙인다", weights: { darius: 2, yi: 1, sett: 1, garen: 1, volibear: 2 } },
      { label: "자원 모아서 후반에 뒤집는다", weights: { kaisa: 2, viktor: 1, lux: 1 } },
    ],
  },
  {
    id: "wincon",
    question: "가장 짜릿한 승리 방식은?",
    options: [
      { label: "커다란 유닛으로 짓밟기", weights: { volibear: 2, garen: 2, sett: 2, leesin: 1 } },
      { label: "주문 연타로 순식간에 정리", weights: { viktor: 2, ahri: 1, annie: 2, lux: 2 } },
      { label: "빠른 연계로 순삭 폭딜", weights: { yi: 2, kaisa: 1, jinx: 1 } },
      { label: "상대가 아무것도 못 하게 봉쇄", weights: { leona: 2, mf: 2, teemo: 1 } },
    ],
  },
  {
    id: "pick",
    question: "덱 고를 때 가장 끌리는 포인트는?",
    options: [
      { label: "티어 높고 안정적인 정석", weights: { yi: 1, kaisa: 2, viktor: 1 } },
      { label: "남들과 다른 개성", weights: { yasuo: 1, jinx: 2, teemo: 2 } },
      { label: "다루기 쉽고 배우기 편함", weights: { garen: 2, darius: 1, annie: 1, sett: 1, volibear: 1 } },
      { label: "파고들수록 강해지는 고난도", weights: { leesin: 2, ahri: 1, viktor: 1, lux: 1, kaisa: 1 } },
    ],
  },
  {
    id: "board",
    question: "전투할 때 선호하는 그림은?",
    options: [
      { label: "큰 유닛 하나로 밀어붙인다", weights: { sett: 2, volibear: 2, garen: 1, darius: 1 } },
      { label: "작은 유닛 여러 개로 넓게 압박", weights: { mf: 2, teemo: 1, annie: 1, yi: 1 } },
      { label: "유닛보다 주문·능력으로 판을 흔든다", weights: { viktor: 1, ahri: 2, lux: 2, jinx: 1, annie: 1 } },
      { label: "상대 유닛을 묶고 무력화한다", weights: { leona: 1, yasuo: 2, ahri: 1, teemo: 1 } },
    ],
  },
  {
    id: "effort",
    question: "손이 많이 가는 플레이는?",
    options: [
      { label: "괜찮다, 콤보·연계 짜는 게 재밌다", weights: { leesin: 2, yasuo: 1, yi: 1, ahri: 1 } },
      { label: "적당한 판단이 필요한 정도가 좋다", weights: { mf: 1, sett: 1, kaisa: 1, viktor: 1, jinx: 1 } },
      { label: "최대한 단순하고 직관적인 게 좋다", weights: { garen: 2, darius: 2, annie: 1, volibear: 1 } },
      { label: "수비적으로 실수 안 하는 게 중요하다", weights: { leona: 2, mf: 1, lux: 1, teemo: 1 } },
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
