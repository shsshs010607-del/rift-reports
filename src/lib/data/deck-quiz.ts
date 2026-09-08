import { TIER_DECKS } from "./tier-list";

/**
 * "내게 맞는 덱 유형" 테스트.
 *
 * 성격/성향을 유머러스하게 묻는 6문항 → 덱별 가중치 합산 → 상위 덱 추천.
 * 가중치는 대부분 1, 덱의 대표 성향에만 2. 16개 덱이 골고루 결과로 나오게 배분.
 * 문항·가중치는 이 파일만 고치면 되고 컴포넌트 수정은 불필요하다.
 *
 * 덱 성향 메모:
 *  yi 빠름·연계폭딜   kaisa 후반성장·자원·수집   viktor 주문램프·장인   annie 분노번·화력
 *  sett 큰유닛·몸싸움  mf 광역·다수압박·존버      yasuo 기절·반격·변수    darius 어그로·처형·직진
 *  volibear 큰유닛·낙뢰  ahri 주문연계·매혹방해   leesin 킥콤보·이동·장인  leona 방어·탱커·봉쇄
 *  jinx 폭딜한방·피니시  teemo 함정·견제·지속딜   garen 정직스탯·입문·쉬움  lux 빛주문·컨트롤·설명충
 */

export type QuizOption = {
  label: string;
  weights: Record<string, number>;
};

export type QuizQuestion = {
  id: string;
  question: string;
  options: QuizOption[];
};

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: "start",
    question: "게임 시작하자마자 나는…",
    options: [
      { label: "인사도 없이 바로 달려든다 🏃", weights: { darius: 2, yi: 1, yasuo: 2, annie: 2 } },
      { label: "일단 상황 보고 간 좀 본다 👀", weights: { kaisa: 1, viktor: 1, sett: 1, mf: 1, garen: 1 } },
      { label: "느긋하게 차 한 잔 하고 시작 ☕", weights: { leona: 2, lux: 2, teemo: 1, kaisa: 1 } },
      { label: "남들 뭐 하나 구경부터 한다 🔭", weights: { ahri: 1, jinx: 1, teemo: 1, yasuo: 1, mf: 1 } },
    ],
  },
  {
    id: "why",
    question: "친구가 \"그거 왜 그렇게 함?\" 하면?",
    options: [
      { label: "\"이게 제일 세니까 (팩트)\"", weights: { yi: 2, kaisa: 1, viktor: 1 } },
      { label: "\"재밌잖아? 🤪\"", weights: { yasuo: 2, jinx: 1, teemo: 2, ahri: 1 } },
      { label: "\"이겼으니까 됐어\"", weights: { darius: 1, sett: 1, garen: 2, mf: 1, volibear: 1 } },
      { label: "\"설명하려면 좀 긴데…\"", weights: { viktor: 2, ahri: 1, lux: 2, leesin: 2 } },
    ],
  },
  {
    id: "desk",
    question: "내 방/책상 상태는?",
    options: [
      { label: "미니멀, 필요한 것만 💼", weights: { garen: 2, darius: 2, yi: 1, annie: 2 } },
      { label: "난장판인데 다 이유가 있음", weights: { yasuo: 2, leesin: 2, ahri: 1, jinx: 2 } },
      { label: "장비·수집품이 벽을 채운다 🗄️", weights: { kaisa: 2, viktor: 1, volibear: 2, sett: 2 } },
      { label: "여기저기 함정처럼 물건이 놓여있음 🪤", weights: { teemo: 2, mf: 2, lux: 1 } },
    ],
  },
  {
    id: "losing",
    question: "지고 있을 때 속마음은?",
    options: [
      { label: "한 방이면 뒤집는다… 던진다 🎲", weights: { jinx: 2, yasuo: 1, teemo: 1, annie: 2 } },
      { label: "침착. 상대가 실수할 때까지 존버 🧘", weights: { leona: 2, mf: 2, lux: 1, teemo: 1 } },
      { label: "더 세게 밀면 되잖아 💪", weights: { darius: 2, yi: 1, sett: 2, volibear: 2, garen: 1 } },
      { label: "후반 가면 내가 이겨 ⏳", weights: { kaisa: 2, viktor: 2, lux: 1 } },
    ],
  },
  {
    id: "wincon",
    question: "가장 짜릿한 승리 장면은?",
    options: [
      { label: "거대한 놈으로 그냥 밟아버리기 🦣", weights: { volibear: 3, sett: 2, garen: 1, leesin: 1 } },
      { label: "주문 콰콰콰 쏟아부어서 순삭 ✨", weights: { viktor: 1, ahri: 2, annie: 2, lux: 2 } },
      { label: "연계 한 번에 상대 체력 증발 ⚡", weights: { yi: 2, kaisa: 1, jinx: 1, leesin: 1 } },
      { label: "상대가 아무것도 못 하고 항복 🚫", weights: { leona: 2, mf: 1, teemo: 1, yasuo: 2 } },
    ],
  },
  {
    id: "pick",
    question: "덱 고를 때 나는?",
    options: [
      { label: "티어표 1위부터 본다 📊", weights: { yi: 1, kaisa: 2, viktor: 1 } },
      { label: "남들 안 쓰는 거 골라서 유행시킨다 😎", weights: { yasuo: 1, jinx: 1, teemo: 1, ahri: 2 } },
      { label: "튜토리얼 없이도 굴릴 수 있는 거 🎮", weights: { garen: 2, darius: 1, annie: 1, sett: 1, volibear: 1 } },
      { label: "파면 팔수록 강해지는 장인용 🔧", weights: { leesin: 2, ahri: 1, viktor: 1, lux: 1, jinx: 1 } },
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
