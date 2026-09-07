/**
 * 리프트바운드 용어집 — Core Rules(2025-12-01) + Origins FAQ 기반.
 *
 * ⚠️ 한글 용어명(term)은 **임시 번역**이다. Riot 공식 API / 한글 클라이언트가 나오면
 *    official 번역명으로 일괄 교체한다(그때 `ko` 를 채우고 `official: true`).
 *    영문명(en)은 공식 canonical 이므로 안정적이며, 화면에도 작게 항상 노출한다.
 *
 * 카드 검색 연동: `cardSearchable: true` 인 용어는 카드 DB 검색과 연결된다.
 *    - 용어집에서 "카드에서 찾기" → /cards?q=<en>
 *    - 카드 검색창에서 용어를 치면 해당 용어 설명으로 안내 (findGlossaryMatches)
 */

export type GlossaryCategory =
  | "기본"
  | "덱빌딩"
  | "자원"
  | "전투"
  | "키워드"
  | "존";

export interface GlossaryTerm {
  /** 표시용 한글명. official=false 면 임시 번역. */
  term: string;
  /** 공식 영문 canonical 명. 항상 존재. */
  en: string;
  /** term(한글명)이 공식 확정 번역인지. 기본 false = 임시. */
  official?: boolean;
  /** 카드/룰 텍스트에 쓰이는 기호 (예: "[M]", "[E]"). */
  symbol?: string;
  category: GlossaryCategory;
  definition: string;
  /** 관련 용어 (term 또는 en 문자열). */
  related?: string[];
  /** 카드 텍스트에 등장 → 카드 검색과 연결. */
  cardSearchable?: boolean;
}

export const GLOSSARY: GlossaryTerm[] = [
  // ── 기본 ──────────────────────────────────────────────
  {
    term: "도메인",
    en: "Domain",
    category: "기본",
    definition:
      "카드의 색 정체성. 6종: 분노(Fury·빨강·R), 침착(Calm·초록·G), 지혜(Mind·파랑·B), 육체(Body·주황·O), 혼돈(Chaos·보라·P), 질서(Order·노랑·Y). 카드 오른쪽 아래 기호로 표시.",
    related: ["Domain Identity", "Power"],
    cardSearchable: true,
  },
  {
    term: "도메인 정체성",
    en: "Domain Identity",
    category: "덱빌딩",
    definition:
      "챔피언 레전드의 도메인이 덱 전체의 정체성을 결정한다. 단일 도메인 카드는 같은 도메인 정체성에, 다중 도메인 카드는 해당 도메인을 모두 포함하는 정체성에만 넣을 수 있다.",
    related: ["Domain", "Champion Legend"],
  },
  {
    term: "위력",
    en: "Might",
    symbol: "[위력]",
    category: "전투",
    definition:
      "유닛의 전투 수치. 전투 기여도와 처치 판정에 쓰인다. 쌓인 데미지가 Might 이상이면 처치. (이전 표기 [S])",
    related: ["Damage", "Kill", "Mighty"],
    cardSearchable: true,
  },
  {
    term: "탈진 / 준비",
    en: "Exhausted / Ready",
    symbol: "[탈진]",
    category: "기본",
    definition:
      "지친 상태는 카드가 옆으로 눕혀진 상태로, 비용이나 이동으로 소모됨을 뜻한다. 각성 페이즈에 모두 준비 상태로 되돌아온다. 유닛은 기본적으로 지쳐서 등장한다.",
    related: ["Awaken Phase", "Accelerate"],
    cardSearchable: true,
  },
  {
    term: "게임 오브젝트",
    en: "Game Object",
    category: "기본",
    definition:
      "게임 효과를 만들거나 행동의 전제가 되는 모든 요소 — 유닛, 룬, 레전드, 전장, 토큰, 체인 위의 능력, 버프 등.",
  },
  {
    term: "토큰",
    en: "Token",
    category: "기본",
    definition:
      "효과로 생성되는 임시 게임 오브젝트. 카드가 아니므로 Legion 등 '카드를 플레이했는가'를 따지는 효과를 켜지 못한다. 보드를 떠나면 사라진다.",
    related: ["Legion"],
    cardSearchable: true,
  },
  {
    term: "버프",
    en: "Buff",
    category: "기본",
    definition:
      "유닛에 붙는 지속 강화. 일부 카드는 '버프가 없으면 +1 [M] 버프를 준다'처럼 버프 유무를 참조한다. 유닛이 비보드 존으로 가면 사라진다.",
    related: ["Might"],
    cardSearchable: true,
  },

  // ── 덱빌딩 ────────────────────────────────────────────
  {
    term: "챔피언 레전드",
    en: "Champion Legend",
    category: "덱빌딩",
    definition:
      "레전드 존에 두고 게임 내내 고정되는 카드. 덱의 도메인 정체성과 챔피언 태그를 정한다. 이동·제거 불가.",
    related: ["Domain Identity", "Chosen Champion", "Legend Zone / Champion Zone"],
  },
  {
    term: "지정 챔피언",
    en: "Chosen Champion",
    category: "덱빌딩",
    definition:
      "덱 구성 시 고른, 레전드와 같은 챔피언 태그를 가진 챔피언 유닛. 챔피언 존에서 시작하며 일반 카드처럼 플레이할 수 있다. 같은 이름의 다른 사본도 모두 '지정 챔피언'으로 취급.",
    related: ["Champion Legend", "Legend Zone / Champion Zone"],
    cardSearchable: true,
  },
  {
    term: "메인 덱",
    en: "Main Deck",
    category: "덱빌딩",
    definition:
      "39~59장. 유닛·도구·주문으로 구성. 같은 이름 카드는 최대 3장. 게임 중 비밀 정보. 카드 효과에서 '카드'는 메인 덱 카드만 가리킨다.",
    related: ["Rune Deck", "Signature"],
  },
  {
    term: "룬 덱",
    en: "Rune Deck",
    category: "덱빌딩",
    definition:
      "정확히 12장의 룬. 레전드 도메인 정체성에 맞아야 하며 메인 덱과 분리해 셔플. 재활용된 룬은 룬 덱으로 돌아간다.",
    related: ["Rune", "Channel", "Recycle"],
  },
  {
    term: "시그니처",
    en: "Signature",
    category: "덱빌딩",
    definition:
      "레전드와 같은 챔피언 태그를 가진 시그니처 카드는 이름과 무관하게 덱에 총 3장까지. 챔피언 유닛이 아니며 챔피언 존에 놓을 수 없다.",
    related: ["Main Deck", "Champion Legend"],
    cardSearchable: true,
  },
  {
    term: "태그",
    en: "Tag",
    category: "덱빌딩",
    definition:
      "챔피언·지역·세력·종족 등을 나타내는 분류. 자체 규칙은 없지만 카드 효과가 참조한다. 레전드·챔피언 유닛·시그니처를 잇는 태그를 챔피언 태그라 한다.",
    cardSearchable: true,
  },

  // ── 자원 ──────────────────────────────────────────────
  {
    term: "에너지",
    en: "Energy",
    category: "자원",
    definition:
      "카드 비용의 숫자 부분을 낸다. 도메인(색)이 없다. 룬을 지치게 하면 1 생성. 턴이 끝나면 소멸.",
    related: ["Power", "Rune", "Rune Pool"],
    cardSearchable: true,
  },
  {
    term: "파워",
    en: "Power",
    symbol: "[아무색] / [자기색]",
    category: "자원",
    definition:
      "카드 비용의 색 기호를 낸다. 도메인이 있다. 룬을 재활용하면 그 룬 도메인의 파워 1 생성. [아무색]=아무 도메인 파워, [자기색]=이 카드 도메인의 파워.",
    related: ["Energy", "Recycle", "Domain"],
    cardSearchable: true,
  },
  {
    term: "룬",
    en: "Rune",
    category: "자원",
    definition:
      "자원을 만드는 카드. 매 턴 충전 페이즈에 2장씩 충전. 지치게 해서 에너지 1, 재활용해서 파워 1 — 같은 턴에 둘 다 가능. 룬 능력은 Reaction(언제든 사용).",
    related: ["Energy", "Power", "Channel", "Recycle", "Seal"],
    cardSearchable: true,
  },
  {
    term: "충전",
    en: "Channel",
    category: "자원",
    definition:
      "룬 덱에서 룬을 보드로 가져오는 것. 매 턴 2장. 12장을 다 충전하면 더 이상 불가(패널티 없음).",
    related: ["Rune", "Rune Deck"],
    cardSearchable: true,
  },
  {
    term: "재활용",
    en: "Recycle",
    category: "자원",
    definition:
      "카드를 덱으로 되돌려 섞는 것. 룬을 재활용하면 파워 1을 만들며 룬 덱으로 돌아간다(지친 룬도 가능). 메인 덱 카드는 메인 덱으로.",
    related: ["Power", "Rune", "Burn Out"],
    cardSearchable: true,
  },
  {
    term: "룬 풀",
    en: "Rune Pool",
    category: "자원",
    definition:
      "만들어 둔 에너지·파워가 담기는 임시 공간. 드로우 페이즈 끝과 턴 끝(만료 단계)에 비워지며 남은 자원은 사라진다.",
    related: ["Energy", "Power"],
  },
  {
    term: "인장",
    en: "Seal",
    category: "자원",
    definition:
      "에너지를 만들 수 없다. 지치게 해서 해당 도메인 파워 1만 생성. 재활용이 아니므로 다음 턴 각성에 다시 준비되어 재사용 가능.",
    related: ["Rune", "Power"],
    cardSearchable: true,
  },
  {
    term: "가속",
    en: "Accelerate",
    category: "키워드",
    definition:
      "추가 비용(에너지 1 + 유닛 도메인 파워 1)을 내면 유닛이 지치지 않고 준비 상태로 등장한다.",
    related: ["Exhausted / Ready"],
    cardSearchable: true,
  },

  // ── 전투 ──────────────────────────────────────────────
  {
    term: "전장",
    en: "Battlefield",
    category: "존",
    definition:
      "점수를 얻는 중립 목표 지점. 각각이 하나의 위치(Location). 지배권을 두고 다툰다. 한 전장에는 최대 두 플레이어(서로 적대)의 유닛만 존재 가능.",
    related: ["Conquer", "Hold", "Control"],
    cardSearchable: true,
  },
  {
    term: "베이스",
    en: "Base",
    category: "존",
    definition:
      "플레이어마다 하나. 유닛·도구를 항상 플레이할 수 있는 자기 위치. 룬도 여기 놓인다. 다른 플레이어는 내 베이스에 오브젝트를 둘 수 없다.",
    related: ["Battlefield", "Recall"],
    cardSearchable: true,
  },
  {
    term: "지배권",
    en: "Control",
    category: "전투",
    definition:
      "전장을 '조종'하는 상태. 유닛만 남기고 상대를 몰아내면 지배권 확립. 유지·점령 점수의 기준.",
    related: ["Conquer", "Hold", "Battlefield"],
    cardSearchable: true,
  },
  {
    term: "점령",
    en: "Conquer",
    category: "전투",
    definition:
      "이번 턴 점수화하지 않았고 조종하지 않던 전장의 지배권을 새로 얻으면 1점.",
    related: ["Hold", "Control"],
    cardSearchable: true,
  },
  {
    term: "유지",
    en: "Hold",
    category: "전투",
    definition: "내 턴이 시작될 때(시작 페이즈) 조종 중인 전장 1개당 1점.",
    related: ["Conquer", "Control"],
    cardSearchable: true,
  },
  {
    term: "결투",
    en: "Showdown",
    category: "전투",
    definition:
      "플레이어들이 Action/Reaction 카드·능력을 번갈아 쓰는 창구. 빈 전장의 지배권을 다투거나 전투가 시작될 때 열린다. 모두 패스하면 종료.",
    related: ["Combat", "Action", "Reaction", "Focus"],
    cardSearchable: true,
  },
  {
    term: "전투",
    en: "Combat",
    category: "전투",
    definition:
      "서로 다른 두 플레이어의 유닛이 같은 전장에 있을 때 발생. 결투를 포함한다. 양측이 상대 유닛 총 Might만큼 데미지를 배분한다.",
    related: ["Showdown", "Damage", "Tie"],
    cardSearchable: true,
  },
  {
    term: "데미지",
    en: "Damage",
    category: "전투",
    definition:
      "유닛에 임시로 쌓이는 값. Might 이상이면 처치. 매 전투 종료 시와 매 턴 종료 시 모두 회복된다.",
    related: ["Might", "Kill", "Heal"],
    cardSearchable: true,
  },
  {
    term: "처치",
    en: "Kill",
    category: "전투",
    definition:
      "유닛·도구가 트래시로 가는 것. 데미지가 Might 이상이거나 직접 처치 효과로 발생.",
    related: ["Damage", "Trash", "Deathknell"],
    cardSearchable: true,
  },
  {
    term: "회복",
    en: "Heal",
    category: "전투",
    definition:
      "유닛에 쌓인 데미지를 제거. 전투 정리와 턴 종료 정리에서 자동으로 일어난다.",
    related: ["Damage"],
    cardSearchable: true,
  },
  {
    term: "소환 회수",
    en: "Recall",
    category: "전투",
    definition:
      "유닛을 자기 베이스로 되돌리는 것. 이동이 아니다. 무승부 시 공격 유닛이 회수된다.",
    related: ["Base", "Tie"],
    cardSearchable: true,
  },
  {
    term: "무승부",
    en: "Tie",
    category: "전투",
    definition:
      "전투에서 양측 유닛이 모두 죽거나 양측 모두 살아남는 결과. 공격 유닛은 베이스로 회수되고 방어자가 지배권 유지(점수 없음).",
    related: ["Combat", "Recall"],
    cardSearchable: true,
  },
  {
    term: "탈진",
    en: "Burn Out",
    category: "기본",
    definition:
      "메인 덱이 비어 드로우할 수 없을 때. 트래시를 덱으로 재활용·셔플하고 상대 1명에게 1점을 준 뒤 드로우한다. 재활용할 트래시도 없으면 상대에게 무한 점수(패배).",
    related: ["Recycle", "Draw"],
    cardSearchable: true,
  },
  {
    term: "드로우",
    en: "Draw",
    category: "기본",
    definition: "메인 덱 맨 위 카드를 손으로 가져온다. 매 턴 드로우 페이즈에 1장.",
    related: ["Burn Out"],
    cardSearchable: true,
  },
  {
    term: "이동",
    en: "Move",
    category: "전투",
    definition:
      "유닛을 위치 간에 옮기는 것. 기본 이동은 유닛을 지치게 해서 베이스↔전장. 스펠·능력에 의한 이동은 상태를 바꾸지 않는다(명시 없으면).",
    related: ["Ganking", "Base", "Battlefield"],
    cardSearchable: true,
  },

  // ── 키워드 ────────────────────────────────────────────
  // 한글명(term)은 한국어판 카드에 인쇄된 표기. 카드 효과 텍스트의 [대괄호] 용어와 일치한다.
  {
    term: "행동",
    en: "Action",
    symbol: "[행동]",
    category: "키워드",
    definition:
      "내 턴 또는 결투(showdown) 중에 플레이할 수 있는 주문. 표기가 없는 주문은 내 주요 단계에만 낼 수 있다.",
    related: ["반응", "Showdown"],
    cardSearchable: true,
  },
  {
    term: "반응",
    en: "Reaction",
    symbol: "[반응]",
    category: "키워드",
    definition:
      "행동의 모든 조건에 더해, 체인이 있을 때(폐쇄 상태)에도 플레이 가능. 체인 위 기존 항목보다 먼저 해결된다.",
    related: ["행동", "Chain"],
    cardSearchable: true,
  },
  {
    term: "숨겨짐",
    en: "Hidden",
    symbol: "[숨겨짐]",
    category: "키워드",
    definition:
      "정상 비용 대신 이 표기의 비용을 내고, 내가 통제하는 전장에 카드를 뒷면으로 숨긴다. 숨긴 턴에는 플레이 불가, 이후 반응 시점에 공개하며 플레이한다. 유닛은 그 전장에 등장한다.",
    related: ["Facedown Zone", "반응"],
    cardSearchable: true,
  },
  {
    term: "개입",
    en: "Ganking",
    symbol: "[개입]",
    category: "키워드",
    definition:
      "이 유닛은 전장에서 전장으로도 이동할 수 있다(기본 이동은 베이스↔전장만 가능). 추가 이동 횟수를 주는 건 아니다.",
    related: ["Move"],
    cardSearchable: true,
  },
  {
    term: "죽음의 종소리",
    en: "Deathknell",
    symbol: "[죽음의 종소리]",
    category: "키워드",
    definition:
      "이 유닛이 처치될 때 발동하는 능력. 정리 단계에서 데미지 회복 전에 트리거가 기록된다.",
    related: ["Kill"],
    cardSearchable: true,
  },
  {
    term: "군단",
    en: "Legion",
    symbol: "[군단]",
    category: "키워드",
    definition:
      "이번 턴에 (이 카드 외에) 카드를 1장 이상 플레이했으면 추가 효과를 얻는다. 토큰 플레이·능력 사용은 카드 플레이가 아니라 켜지 않는다.",
    related: ["Token"],
    cardSearchable: true,
  },
  {
    term: "위력적",
    en: "Mighty",
    symbol: "[위력적]",
    category: "키워드",
    definition: "위력이 5 이상인 유닛은 '위력적'으로 취급된다. 별도 표기 없이 조건만 충족하면 된다.",
    related: ["Might"],
    cardSearchable: true,
  },
  {
    term: "통찰",
    en: "Vision",
    symbol: "[통찰]",
    category: "키워드",
    definition: "메인 덱 맨 위 카드를 보고, 원한다면 재활용할 수 있다.",
    related: ["Recycle"],
    cardSearchable: true,
  },
  {
    term: "굴절",
    en: "Deflect",
    symbol: "[굴절]",
    category: "키워드",
    definition:
      "상대가 주문으로 이 유닛을 대상으로 지정하려면 룬 1개를 추가로 지불해야 한다. [굴절 N] 이면 N개.",
    cardSearchable: true,
  },
  {
    term: "보호막",
    en: "Shield",
    symbol: "[보호막 N]",
    category: "키워드",
    definition:
      "이 카드가 방어자일 때 위력이 +N 된다. 예: [보호막 2] → 방어 시 위력 +2.",
    related: ["위력적", "Combat"],
    cardSearchable: true,
  },
  {
    term: "맹공",
    en: "Assault",
    symbol: "[맹공 N]",
    category: "키워드",
    definition:
      "이 카드가 공격자일 때 위력이 +N 된다. 예: [맹공 2] → 공격 시 위력 +2.",
    related: ["보호막", "Combat"],
    cardSearchable: true,
  },
  {
    term: "탱커",
    en: "Tank",
    symbol: "[탱커]",
    category: "키워드",
    definition:
      "이 유닛이 있는 전장에서 아군 유닛이 받을 전투 데미지를 이 유닛이 대신 받는다.",
    related: ["Damage", "보호막"],
    cardSearchable: true,
  },
  {
    term: "추가",
    en: "Add",
    symbol: "[추가]",
    category: "키워드",
    definition:
      "지정한 룬(자원)을 내 룬 풀에 넣는다. `[추가] :rb_rune_X:` 형태로 표기. 자원을 추가하는 능력에는 반응할 수 없다.",
    related: ["Rune Pool", "Channel"],
    cardSearchable: true,
  },
  {
    term: "일시적",
    en: "Temporary",
    symbol: "[일시적]",
    category: "키워드",
    definition: "이 카드는 이번 라운드가 끝나면 처치된다(트래시로 간다).",
    related: ["Token", "Trash"],
    cardSearchable: true,
  },
  {
    term: "보너스 데미지",
    en: "Bonus Damage",
    symbol: "[보너스 데미지]",
    category: "키워드",
    definition: "주문·능력이 주는 각 데미지 인스턴스를 지정된 값만큼 증가시킨다.",
    related: ["Damage"],
    cardSearchable: true,
  },
  {
    term: "기절",
    en: "Stun",
    symbol: "[기절]",
    category: "키워드",
    definition:
      "대상 유닛을 기절시킨다. 기절한 유닛은 이번 턴 전투의 피해 단계 동안 위력을 제공하지 못한다(전투에 있어도 위력 0으로 취급). 방어·처치 판정을 무력화하는 데 쓰인다.",
    related: ["Might", "Combat", "Damage"],
    cardSearchable: true,
  },
  {
    term: "예측",
    en: "Predict",
    symbol: "[예측]",
    category: "키워드",
    definition:
      "메인 덱 맨 위 카드를 확인한 뒤, 그대로 두거나 덱 맨 아래로 보낸다. 통찰(Vision)과 함께 드로우 품질을 끌어올리는 효과.",
    related: ["Vision", "Draw", "Main Deck"],
    cardSearchable: true,
  },
  {
    term: "장착",
    en: "Equip",
    symbol: "[장착]",
    category: "키워드",
    definition:
      "장착 비용을 지불하고 내 유닛 1명에게 장비(도구) 카드를 부착한다. 장착한 유닛에게 능력치·능력을 부여하며, 장비 재부착으로 다른 유닛에게 옮길 수 있다.",
    related: ["Quick-Draw", "Energy"],
    cardSearchable: true,
  },
  {
    term: "빨리 뽑기",
    en: "Quick-Draw",
    symbol: "[빨리 뽑기]",
    category: "키워드",
    definition:
      "장비를 반응(Reaction) 타이밍에, 장착 비용 없이 내 유닛에게 즉시 장착한다. 전투 중 기습적으로 능력치를 붙이는 데 쓰인다.",
    related: ["Equip", "Reaction"],
    cardSearchable: true,
  },

  // ── 존 ────────────────────────────────────────────────
  {
    term: "체인",
    en: "Chain",
    category: "존",
    definition:
      "카드가 플레이되거나 능력이 활성화될 때 임시로 존재하는 비보드 존. 한 번에 하나만. 가장 최근 항목이 먼저 해결된다(후입선출).",
    related: ["Showdown", "Reaction", "Priority"],
  },
  {
    term: "트래시",
    en: "Trash",
    category: "존",
    definition:
      "처치·버림·소모된 카드가 가는 곳. 순서 없음, 공개 정보. 탈진 시 덱으로 재활용된다.",
    related: ["Kill", "Burn Out", "Banishment"],
    cardSearchable: true,
  },
  {
    term: "추방",
    en: "Banishment",
    category: "존",
    definition:
      "회수하기 더 어렵게 제거되거나, 효과 처리 중 임시로 카드를 잡아두는 공간. 공개 정보. 플레이하지 못한 카드가 남기도 한다.",
    related: ["Trash"],
    cardSearchable: true,
  },
  {
    term: "페이스다운 존",
    en: "Facedown Zone",
    category: "존",
    definition:
      "각 전장에 딸린 하위 공간. 최대 1장. 그 전장을 조종하는 플레이어만 카드를 숨길 수 있고, 지배권을 잃으면 다음 정리에 트래시로 간다.",
    related: ["Hidden", "Battlefield"],
  },
  {
    term: "레전드 존 / 챔피언 존",
    en: "Legend Zone / Champion Zone",
    category: "존",
    definition:
      "레전드 존은 챔피언 레전드가 게임 내내 머무는 곳(이동 불가). 챔피언 존은 지정 챔피언이 게임 시작 시 놓이는 곳으로, 여기서 일반 카드처럼 플레이할 수 있다.",
    related: ["Champion Legend", "Chosen Champion"],
  },
  {
    term: "포커스",
    en: "Focus",
    category: "전투",
    definition:
      "결투(개방 상태)에서 적절한 시점에 행동할 수 있는 권한. 포커스를 얻으면 우선권도 얻는다. 스펠·능력을 쓰지 않고 패스하면 포커스가 넘어간다.",
    related: ["Showdown", "Priority"],
  },
  {
    term: "우선권",
    en: "Priority",
    category: "전투",
    definition:
      "재량 행동(카드 플레이·능력 활성화 등)을 할 수 있는 유일·배타적 권리. 내 행동 페이즈, 또는 포커스를 얻었을 때, 또는 체인에서 내 항목 차례일 때 받는다.",
    related: ["Focus", "Chain"],
  },
];

export const GLOSSARY_CATEGORIES: GlossaryCategory[] = [
  "기본",
  "덱빌딩",
  "자원",
  "전투",
  "키워드",
  "존",
];

// ────────────────────────────────────────────────────────
//  검색 헬퍼 (카드 DB 페이지에서 재사용)
// ────────────────────────────────────────────────────────

function norm(s: string) {
  return s.toLowerCase().replace(/[\s[\]]+/g, "").replace(/\d+$/, "");
}

/** 카드 검색어가 용어집에 해당하면 그 용어들을 반환 (카드 페이지에서 "용어: XXX" 힌트로 노출). */
export function findGlossaryMatches(query: string): GlossaryTerm[] {
  const q = norm(query);
  if (q.length < 2) return [];
  return GLOSSARY.filter((t) => {
    const keys = [t.term, t.en, t.symbol ?? ""].map(norm).filter(Boolean);
    return keys.some((k) => k === q || k.includes(q) || q.includes(k));
  });
}

/** 카드 효과 텍스트에서 쓰이는 `[대괄호]` 용어 → 용어집 항목. (텍스트 렌더 시 링크용) */
export function glossaryByBracket(bracket: string): GlossaryTerm | undefined {
  const key = norm(bracket);
  return GLOSSARY.find((t) =>
    [t.term, t.en, t.symbol ?? ""].some((s) => s && norm(s) === key),
  );
}

/** 용어 → 카드 검색 쿼리스트링. 영문 canonical 로 카드 rules text 를 검색. */
export function glossaryToCardHref(t: GlossaryTerm): string {
  return `/cards?q=${encodeURIComponent(t.en)}`;
}
