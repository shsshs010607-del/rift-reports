/**
 * "내 MBTI에 맞는 덱 찾기".
 *
 * 8문항(E/I·S/N·T/F·J/P 각 2문항) → 4글자 MBTI → 16유형별 덱 매핑.
 * 문항·매핑은 이 파일만 고치면 되고 컴포넌트는 결과 필드만 읽는다.
 */

export type Axis = "EI" | "SN" | "TF" | "JP";
export type MbtiCode = string; // "ENTP" 등

export type QuizOption = {
  label: string;
  /** 이 선택이 가리키는 글자 (E/I/S/N/T/F/J/P 중 하나). */
  letter: string;
};

export type QuizQuestion = {
  id: string;
  axis: Axis;
  question: string;
  options: [QuizOption, QuizOption];
};

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: "ei1",
    axis: "EI",
    question: "새 카드팩을 뜯고 나면?",
    options: [
      { label: "바로 단톡방에 자랑하고 같이 뜯자고 한다 📣", letter: "E" },
      { label: "혼자 조용히 정리하면서 뭐 나왔나 음미한다 🔍", letter: "I" },
    ],
  },
  {
    id: "ei2",
    axis: "EI",
    question: "매장 대회에 갔다. 시작 전 나는?",
    options: [
      { label: "여기저기 인사 다니며 덱 얘기로 수다 💬", letter: "E" },
      { label: "구석 자리에서 내 덱 마지막 점검 🎧", letter: "I" },
    ],
  },
  {
    id: "sn1",
    axis: "SN",
    question: "덱을 짤 때 먼저 보는 건?",
    options: [
      { label: "지금 검증된, 잘 나가는 카드부터 📊", letter: "S" },
      { label: "아무도 안 쓰는 조합의 가능성 💡", letter: "N" },
    ],
  },
  {
    id: "sn2",
    axis: "SN",
    question: "공략 가이드를 읽을 때?",
    options: [
      { label: "1번부터 순서대로 정확히 따라 한다 📝", letter: "S" },
      { label: "핵심 원리만 잡고 내 식으로 응용 🌀", letter: "N" },
    ],
  },
  {
    id: "tf1",
    axis: "TF",
    question: "친구가 내 덱에 지고 시무룩해지면?",
    options: [
      { label: "어디서 플레이가 어긋났는지 짚어준다 🧮", letter: "T" },
      { label: '일단 "방금 그 판 개꿀잼이었다"고 분위기부터 🫂', letter: "F" },
    ],
  },
  {
    id: "tf2",
    axis: "TF",
    question: "덱을 고르는 최종 기준은?",
    options: [
      { label: "승률과 효율, 숫자가 말해준다 📈", letter: "T" },
      { label: "손맛과 내 취향, 재미없으면 안 한다 💖", letter: "F" },
    ],
  },
  {
    id: "jp1",
    axis: "JP",
    question: "게임 중 계획이 틀어졌다!",
    options: [
      { label: "미리 짜둔 플랜 B로 침착하게 전환 🗂️", letter: "J" },
      { label: "즉흥으로 그 자리에서 새 그림을 그린다 🎨", letter: "P" },
    ],
  },
  {
    id: "jp2",
    axis: "JP",
    question: "내 덱 리스트는?",
    options: [
      { label: "40장 확정. 웬만해선 안 바꾼다 🔒", letter: "J" },
      { label: "매 판 한두 장씩 계속 만지작거린다 🔧", letter: "P" },
    ],
  },
];

export type MbtiType = {
  code: MbtiCode;
  /** 유형 별명 (덱 이름과 합쳐 "관리감독자 다리우스" 처럼 표시). */
  nickname: string;
  hashtags: string[];
  traits: string[];
  /** 가장 잘 맞는 덱. */
  deckId: string;
  /** 상극인 덱 — 해당 덱의 실제 상대전적 최악 매치업 기준 (Piltover Archive 승률표 참고). */
  worstDeckId: string;
};

export const MBTI_TYPES: Record<MbtiCode, MbtiType> = {
  ISTJ: {
    code: "ISTJ",
    nickname: "원칙주의 기본기 장인",
    hashtags: ["#정석", "#기본기", "#꾸준함", "#안정"],
    traits: [
      "화려한 콤보보다 확실한 한 수를 믿는다",
      "덱 리스트도 방 정리도 딱 맞아떨어져야 마음이 편하다",
      "룰과 매너를 지키고, 상대에게도 그걸 기대한다",
      "검증 안 된 신카드는 일단 지켜보는 편",
      "지고 있어도 흔들리지 않고 계획대로 둔다",
    ],
    deckId: "garen",
    worstDeckId: "jinx",
  },
  ISFJ: {
    code: "ISFJ",
    nickname: "묵묵히 팀을 지키는 방패",
    hashtags: ["#수비", "#헌신", "#인내", "#보호"],
    traits: [
      "먼저 나서기보다 뒤를 단단히 받치는 역할이 편하다",
      "상대가 지칠 때까지 버티는 존버의 달인",
      "판을 흔드는 변수보다 안정적인 방어를 선호",
      "덱의 약점을 미리 메워두는 세심함",
      "이겨도 요란하게 세리머니하지 않는다",
    ],
    deckId: "leona",
    worstDeckId: "kaisa",
  },
  INFJ: {
    code: "INFJ",
    nickname: "큰 그림을 그리는 설계자",
    hashtags: ["#통찰", "#장기전", "#엔진", "#완성"],
    traits: [
      "몇 턴 뒤의 그림을 머릿속에 미리 그려둔다",
      "조용히 자원을 쌓다가 한 번에 완성형을 낸다",
      "왜 이렇게 두는지 설명하려면 항상 좀 길어진다",
      "겉은 차분한데 승부욕은 은근히 강하다",
      "남들이 안 보는 상호작용을 잘 찾아낸다",
    ],
    deckId: "viktor",
    worstDeckId: "kaisa",
  },
  INTJ: {
    code: "INTJ",
    nickname: "후반을 계산하는 전략가",
    hashtags: ["#설계", "#후반캐리", "#자원", "#냉정"],
    traits: [
      '"후반 가면 내가 이겨"가 입버릇',
      "초반 손해는 계산된 투자라고 생각한다",
      "감정보다 효율, 필요 없는 카드는 가차 없이 뺀다",
      "장기 플랜이 서면 도중에 잘 안 흔들린다",
      "티어표보다 자기 분석을 더 믿는다",
    ],
    deckId: "kaisa",
    worstDeckId: "yi",
  },
  ISTP: {
    code: "ISTP",
    nickname: "손이 먼저 나가는 콤보 장인",
    hashtags: ["#손기술", "#즉흥", "#콤보", "#실전"],
    traits: [
      "이론 설명보다 일단 손이 먼저 움직인다",
      "책상은 난장판인데 본인은 다 어디 있는지 안다",
      "이동·연계 타이밍을 몸으로 외우는 타입",
      "파고들수록 강해지는 고난도 덱에 끌린다",
      "위기 상황에서 오히려 침착해진다",
    ],
    deckId: "leesin",
    worstDeckId: "yi",
  },
  ISFP: {
    code: "ISFP",
    nickname: "말없이 끝내는 순간의 검",
    hashtags: ["#감각", "#속도", "#과묵", "#한방"],
    traits: [
      "말수는 적지만 결정적일 때 한순간에 끝낸다",
      "필요한 것만 남긴 미니멀한 덱을 좋아한다",
      '"이게 제일 세니까" — 설명은 짧게',
      "느낌이 오는 타이밍을 놓치지 않는다",
      "튀는 걸 원하진 않지만 실력은 확실하다",
    ],
    deckId: "yi",
    worstDeckId: "teemo",
  },
  INFP: {
    code: "INFP",
    nickname: "내 취향대로 예쁘게 이긴다",
    hashtags: ["#낭만", "#취향", "#컨트롤", "#마이웨이"],
    traits: [
      '승률보다 "이 덱이 나답나"가 먼저다',
      "남들이 안 쓰는 조합을 굳이 완성시킨다",
      "빛나는 주문 한 방의 그림을 좋아한다",
      "설명충 기질이 있어 콤보 해설이 길어진다",
      "이기는 방식에도 미학이 있다고 믿는다",
    ],
    deckId: "lux",
    worstDeckId: "kaisa",
  },
  INTP: {
    code: "INTP",
    nickname: "상호작용을 실험하는 이론가",
    hashtags: ["#실험", "#변수", "#분석", "#상호작용"],
    traits: [
      '"이거 이렇게 되면 어떻게 되지?"를 계속 시험한다',
      "매혹·바운스 같은 방해 상호작용을 좋아한다",
      "덱을 매 판 조금씩 계속 고친다",
      "정석보다 반례를 찾는 데 재미를 느낀다",
      "감정 싸움은 피하고 판 자체에 집중",
    ],
    deckId: "ahri",
    worstDeckId: "annie",
  },
  ESTP: {
    code: "ESTP",
    nickname: "일단 지르고 보는 승부사",
    hashtags: ["#모험", "#즉행", "#변수", "#배짱"],
    traits: [
      "인사도 없이 바로 달려든다",
      '"재밌잖아?"가 모든 플레이의 이유',
      "기절·반격으로 판을 뒤집는 변수 플레이를 즐긴다",
      "지고 있으면 더 크게 지른다",
      "계획보다 지금 이 순간의 판단을 믿는다",
    ],
    deckId: "yasuo",
    worstDeckId: "kaisa",
  },
  ESFP: {
    code: "ESFP",
    nickname: "화려한 한 방, 관종력 만렙",
    hashtags: ["#화려함", "#한방", "#관종", "#피니시"],
    traits: [
      "남들 안 쓰는 덱을 골라 기어이 유행시킨다",
      "한 방에 상대 체력을 증발시키는 피니시가 로망",
      "이겼을 때 리액션이 제일 크다",
      "밋밋한 정석 덱은 금방 질린다",
      "분위기 띄우는 데 진심",
    ],
    deckId: "jinx",
    worstDeckId: "yi",
  },
  ENFP: {
    code: "ENFP",
    nickname: "사방에 장난을 깔아두는 개척자",
    hashtags: ["#창의", "#장난", "#견제", "#자유"],
    traits: [
      "여기저기 함정처럼 수를 깔아두는 걸 좋아한다",
      "아이디어가 넘쳐서 덱 콘셉트가 자주 바뀐다",
      "상대를 약올리며 견제하는 지속 플레이",
      "정해진 틀보다 그때그때의 즉흥이 편하다",
      "새로운 조합 실험이 제일 재밌다",
    ],
    deckId: "teemo",
    worstDeckId: "annie",
  },
  ENTP: {
    code: "ENTP",
    nickname: "도발하고 불을 지르는 변론가",
    hashtags: ["#도발", "#화력", "#속공", "#임기응변"],
    traits: [
      '"그거 왜 그렇게 함?"에 논쟁으로 응수한다',
      "화력을 몰아쳐 초반부터 밀어붙인다",
      "상대 멘탈을 흔드는 플레이를 즐긴다",
      "계획이 틀어져도 그 자리에서 새 각을 만든다",
      "지루한 장기전보다 빠른 결판을 선호",
    ],
    deckId: "annie",
    worstDeckId: "jinx",
  },
  ESTJ: {
    code: "ESTJ",
    nickname: "목표로 직진하는 관리감독자",
    hashtags: ["#현실", "#실용", "#추진력", "#처형"],
    traits: [
      "화끈하고 솔직하며 직설적인 편이다",
      "효율 안 나오는 카드는 바로 정리한다",
      '"이겼으니까 됐어" — 과정보다 결과',
      "목표가 정해지면 곧장 상대 본체로 직진한다",
      "판을 주도하고 지휘하는 데 익숙하다",
    ],
    deckId: "darius",
    worstDeckId: "kaisa",
  },
  ESFJ: {
    code: "ESFJ",
    nickname: "물량으로 판을 장악하는 리더",
    hashtags: ["#사교", "#물량", "#광역", "#장악"],
    traits: [
      "혼자보다 여럿이서 압박하는 걸 좋아한다",
      "광역기로 판 전체를 정리하며 주도권을 쥔다",
      "상대가 아무것도 못 하게 만드는 존버형 압박",
      "분위기와 흐름을 읽는 감이 좋다",
      "안정적으로 판을 관리하는 걸 선호",
    ],
    deckId: "mf",
    worstDeckId: "yasuo",
  },
  ENFJ: {
    code: "ENFJ",
    nickname: "앞장서서 부딪치는 주장",
    hashtags: ["#카리스마", "#몸싸움", "#리드", "#돌파"],
    traits: [
      "큰 유닛을 앞세워 직접 몸으로 부딪친다",
      "판의 흐름을 앞에서 이끄는 걸 좋아한다",
      '"더 세게 밀면 되잖아" 정신',
      "우두머리 기질, 주변을 끌고 가는 힘이 있다",
      "정면 승부를 피하지 않는다",
    ],
    deckId: "sett",
    worstDeckId: "darius",
  },
  ENTJ: {
    code: "ENTJ",
    nickname: "힘으로 찍어누르는 통솔자",
    hashtags: ["#지배", "#물리력", "#압도", "#통솔"],
    traits: [
      "거대한 유닛으로 그냥 밟아버리는 게 제일 짜릿하다",
      "장비·수집품으로 벽을 채우는 축적형",
      "판을 지배권으로 완전히 눌러버린다",
      "계획대로 상대 선택지를 하나씩 지운다",
      "질질 끄는 걸 싫어하고 확실하게 끝낸다",
    ],
    deckId: "volibear",
    worstDeckId: "annie",
  },
};

export type QuizResult = {
  type: MbtiType;
  deckId: string;
  worstDeckId: string;
};

/** 축별 동점 시 기본 글자. */
const TIE_DEFAULT: Record<Axis, string> = { EI: "I", SN: "N", TF: "F", JP: "P" };
const AXIS_ORDER: Axis[] = ["EI", "SN", "TF", "JP"];
const AXIS_PAIR: Record<Axis, [string, string]> = {
  EI: ["E", "I"],
  SN: ["S", "N"],
  TF: ["T", "F"],
  JP: ["J", "P"],
};

export function scoreQuiz(answers: (number | null)[]): QuizResult {
  const tally: Record<string, number> = {};
  answers.forEach((optIdx, qi) => {
    if (optIdx == null) return;
    const opt = QUIZ_QUESTIONS[qi]?.options[optIdx];
    if (opt) tally[opt.letter] = (tally[opt.letter] ?? 0) + 1;
  });

  const code = AXIS_ORDER.map((axis) => {
    const [a, b] = AXIS_PAIR[axis];
    const na = tally[a] ?? 0;
    const nb = tally[b] ?? 0;
    if (na === nb) return TIE_DEFAULT[axis];
    return na > nb ? a : b;
  }).join("");

  const type = MBTI_TYPES[code] ?? MBTI_TYPES.ISTJ;
  return { type, deckId: type.deckId, worstDeckId: type.worstDeckId };
}
