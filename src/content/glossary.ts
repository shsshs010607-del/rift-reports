/**
 * 리프트바운드 용어집 — Core Rules(2025-12-01) + Origins FAQ 기반.
 * DB(glossary_terms) 연동 전까지 사용하는 정적 소스. 스크립트로 seed 생성 가능.
 */

export type GlossaryCategory =
  | "기본"
  | "덱빌딩"
  | "자원"
  | "전투"
  | "키워드"
  | "존";

export interface GlossaryTerm {
  term: string;
  reading?: string; // 영문/발음
  category: GlossaryCategory;
  definition: string;
  related?: string[];
}

export const GLOSSARY: GlossaryTerm[] = [
  // ── 기본 ──────────────────────────────────────────────
  {
    term: "도메인",
    reading: "Domain",
    category: "기본",
    definition:
      "카드의 색 정체성. 6종: 분노(Fury·빨강·R), 침착(Calm·초록·G), 지혜(Mind·파랑·B), 육체(Body·주황·O), 혼돈(Chaos·보라·P), 질서(Order·노랑·Y). 카드 오른쪽 아래 기호로 표시.",
    related: ["도메인 정체성", "파워"],
  },
  {
    term: "도메인 정체성",
    reading: "Domain Identity",
    category: "덱빌딩",
    definition:
      "챔피언 레전드의 도메인이 덱 전체의 정체성을 결정한다. 단일 도메인 카드는 같은 도메인 정체성에, 다중 도메인 카드는 해당 도메인을 모두 포함하는 정체성에만 넣을 수 있다.",
    related: ["도메인", "챔피언 레전드"],
  },
  {
    term: "Might",
    reading: "마이트 · [M]",
    category: "전투",
    definition:
      "유닛의 전투 수치. 전투 기여도와 처치 판정에 쓰인다. 쌓인 데미지가 Might 이상이면 처치. (이전 표기 [S])",
    related: ["데미지", "처치", "Mighty"],
  },
  {
    term: "지침 / 준비",
    reading: "Exhausted / Ready · [E]",
    category: "기본",
    definition:
      "지친 상태는 카드가 옆으로 눕혀진 상태로, 비용이나 이동으로 소모됨을 뜻한다. 각성 페이즈에 모두 준비 상태로 되돌아온다. 유닛은 기본적으로 지쳐서 등장한다.",
    related: ["각성 페이즈", "가속"],
  },
  {
    term: "게임 오브젝트",
    reading: "Game Object",
    category: "기본",
    definition:
      "게임 효과를 만들거나 행동의 전제가 되는 모든 요소 — 유닛, 룬, 레전드, 전장, 토큰, 체인 위의 능력, 버프 등.",
  },
  {
    term: "토큰",
    reading: "Token",
    category: "기본",
    definition:
      "효과로 생성되는 임시 게임 오브젝트. 카드가 아니므로 Legion 등 '카드를 플레이했는가'를 따지는 효과를 켜지 못한다. 보드를 떠나면 사라진다.",
    related: ["Legion"],
  },

  // ── 덱빌딩 ────────────────────────────────────────────
  {
    term: "챔피언 레전드",
    reading: "Champion Legend",
    category: "덱빌딩",
    definition:
      "레전드 존에 두고 게임 내내 고정되는 카드. 덱의 도메인 정체성과 챔피언 태그를 정한다. 이동·제거 불가.",
    related: ["도메인 정체성", "지정 챔피언", "레전드 존"],
  },
  {
    term: "지정 챔피언",
    reading: "Chosen Champion",
    category: "덱빌딩",
    definition:
      "덱 구성 시 고른, 레전드와 같은 챔피언 태그를 가진 챔피언 유닛. 챔피언 존에서 시작하며 일반 카드처럼 플레이할 수 있다. 같은 이름의 다른 사본도 모두 '지정 챔피언'으로 취급.",
    related: ["챔피언 레전드", "챔피언 존"],
  },
  {
    term: "메인 덱",
    reading: "Main Deck",
    category: "덱빌딩",
    definition:
      "40장 이상. 유닛·장비·주문으로 구성. 같은 이름 카드는 최대 3장. 게임 중 비밀 정보. 카드 효과에서 '카드'는 메인 덱 카드만 가리킨다.",
    related: ["룬 덱", "시그니처"],
  },
  {
    term: "룬 덱",
    reading: "Rune Deck",
    category: "덱빌딩",
    definition:
      "정확히 12장의 룬. 레전드 도메인 정체성에 맞아야 하며 메인 덱과 분리해 셔플. 재활용된 룬은 룬 덱으로 돌아간다.",
    related: ["룬", "충전", "재활용"],
  },
  {
    term: "시그니처",
    reading: "Signature",
    category: "덱빌딩",
    definition:
      "레전드와 같은 챔피언 태그를 가진 시그니처 카드는 이름과 무관하게 덱에 총 3장까지. 챔피언 유닛이 아니며 챔피언 존에 놓을 수 없다.",
    related: ["메인 덱", "챔피언 레전드"],
  },
  {
    term: "태그",
    reading: "Tag",
    category: "덱빌딩",
    definition:
      "챔피언·지역·세력·종족 등을 나타내는 분류. 자체 규칙은 없지만 카드 효과가 참조한다. 레전드·챔피언 유닛·시그니처를 잇는 태그를 챔피언 태그라 한다.",
  },

  // ── 자원 ──────────────────────────────────────────────
  {
    term: "에너지",
    reading: "Energy",
    category: "자원",
    definition:
      "카드 비용의 숫자 부분을 낸다. 도메인(색)이 없다. 룬을 지치게 하면 1 생성. 턴이 끝나면 소멸.",
    related: ["파워", "룬", "룬 풀"],
  },
  {
    term: "파워",
    reading: "Power",
    category: "자원",
    definition:
      "카드 비용의 색 기호를 낸다. 도메인이 있다. 룬을 재활용하면 그 룬 도메인의 파워 1 생성. [A]=아무 도메인 파워, [C]=이 카드 도메인의 파워.",
    related: ["에너지", "재활용", "도메인"],
  },
  {
    term: "룬",
    reading: "Rune",
    category: "자원",
    definition:
      "자원을 만드는 카드. 매 턴 충전 페이즈에 2장씩 충전. 지치게 해서 에너지 1, 재활용해서 파워 1 — 같은 턴에 둘 다 가능. 룬 능력은 Reaction(언제든 사용).",
    related: ["에너지", "파워", "충전", "재활용", "인장"],
  },
  {
    term: "충전",
    reading: "Channel",
    category: "자원",
    definition:
      "룬 덱에서 룬을 보드로 가져오는 것. 매 턴 2장. 12장을 다 충전하면 더 이상 불가(패널티 없음).",
    related: ["룬", "룬 덱"],
  },
  {
    term: "재활용",
    reading: "Recycle",
    category: "자원",
    definition:
      "카드를 덱으로 되돌려 섞는 것. 룬을 재활용하면 파워 1을 만들며 룬 덱으로 돌아간다(지친 룬도 가능). 메인 덱 카드는 메인 덱으로.",
    related: ["파워", "룬", "탈진"],
  },
  {
    term: "룬 풀",
    reading: "Rune Pool",
    category: "자원",
    definition:
      "만들어 둔 에너지·파워가 담기는 임시 공간. 드로우 페이즈 끝과 턴 끝(만료 단계)에 비워지며 남은 자원은 사라진다.",
    related: ["에너지", "파워"],
  },
  {
    term: "인장",
    reading: "Seal",
    category: "자원",
    definition:
      "에너지를 만들 수 없다. 지치게 해서 해당 도메인 파워 1만 생성. 재활용이 아니므로 다음 턴 각성에 다시 준비되어 재사용 가능.",
    related: ["룬", "파워"],
  },
  {
    term: "가속",
    reading: "Accelerate",
    category: "키워드",
    definition:
      "추가 비용(에너지 1 + 유닛 도메인 파워 1)을 내면 유닛이 지치지 않고 준비 상태로 등장한다.",
    related: ["지침 / 준비"],
  },

  // ── 전투 ──────────────────────────────────────────────
  {
    term: "전장",
    reading: "Battlefield",
    category: "존",
    definition:
      "점수를 얻는 중립 목표 지점. 각각이 하나의 위치(Location). 지배권을 두고 다툰다. 한 전장에는 최대 두 플레이어(서로 적대)의 유닛만 존재 가능.",
    related: ["점령", "유지", "지배권"],
  },
  {
    term: "베이스",
    reading: "Base",
    category: "존",
    definition:
      "플레이어마다 하나. 유닛·장비를 항상 플레이할 수 있는 자기 위치. 룬도 여기 놓인다. 다른 플레이어는 내 베이스에 오브젝트를 둘 수 없다.",
    related: ["전장", "이동"],
  },
  {
    term: "지배권",
    reading: "Control",
    category: "전투",
    definition:
      "전장을 '조종'하는 상태. 유닛만 남기고 상대를 몰아내면 지배권 확립. 유지·점령 점수의 기준.",
    related: ["점령", "유지", "전장"],
  },
  {
    term: "점령",
    reading: "Conquer",
    category: "전투",
    definition:
      "이번 턴 점수화하지 않았고 조종하지 않던 전장의 지배권을 새로 얻으면 1점.",
    related: ["유지", "지배권"],
  },
  {
    term: "유지",
    reading: "Hold",
    category: "전투",
    definition:
      "내 턴이 시작될 때(시작 페이즈) 조종 중인 전장 1개당 1점.",
    related: ["점령", "지배권"],
  },
  {
    term: "결투",
    reading: "Showdown",
    category: "전투",
    definition:
      "플레이어들이 Action/Reaction 카드·능력을 번갈아 쓰는 창구. 빈 전장의 지배권을 다투거나 전투가 시작될 때 열린다. 모두 패스하면 종료.",
    related: ["전투", "Action", "Reaction", "포커스"],
  },
  {
    term: "전투",
    reading: "Combat",
    category: "전투",
    definition:
      "서로 다른 두 플레이어의 유닛이 같은 전장에 있을 때 발생. 결투를 포함한다. 양측이 상대 유닛 총 Might만큼 데미지를 배분한다.",
    related: ["결투", "데미지", "무승부"],
  },
  {
    term: "데미지",
    reading: "Damage",
    category: "전투",
    definition:
      "유닛에 임시로 쌓이는 값. Might 이상이면 처치. 매 전투 종료 시와 매 턴 종료 시 모두 회복된다.",
    related: ["Might", "처치", "회복"],
  },
  {
    term: "처치",
    reading: "Kill",
    category: "전투",
    definition:
      "유닛·장비가 트래시로 가는 것. 데미지가 Might 이상이거나 직접 처치 효과로 발생.",
    related: ["데미지", "트래시", "Deathknell"],
  },
  {
    term: "회복",
    reading: "Heal",
    category: "전투",
    definition:
      "유닛에 쌓인 데미지를 제거. 전투 정리와 턴 종료 정리에서 자동으로 일어난다.",
    related: ["데미지"],
  },
  {
    term: "소환 회수",
    reading: "Recall",
    category: "전투",
    definition:
      "유닛을 자기 베이스로 되돌리는 것. 이동이 아니다. 무승부 시 공격 유닛이 회수된다.",
    related: ["베이스", "무승부"],
  },
  {
    term: "탈진",
    reading: "Burn Out",
    category: "기본",
    definition:
      "메인 덱이 비어 드로우할 수 없을 때. 트래시를 덱으로 재활용·셔플하고 상대 1명에게 1점을 준 뒤 드로우한다. 재활용할 트래시도 없으면 상대에게 무한 점수(패배).",
    related: ["재활용", "드로우"],
  },

  // ── 키워드 ────────────────────────────────────────────
  {
    term: "Action",
    reading: "액션",
    category: "키워드",
    definition:
      "개방 상태뿐 아니라 결투 중 개방 상태에서도 플레이할 수 있는 주문.",
    related: ["Reaction", "결투"],
  },
  {
    term: "Reaction",
    reading: "리액션",
    category: "키워드",
    definition:
      "Action의 모든 조건에 더해, 폐쇄 상태(체인이 있을 때)에서도 플레이 가능. 체인 위 기존 항목보다 먼저 해결된다.",
    related: ["Action", "체인"],
  },
  {
    term: "Hidden",
    reading: "히든 · 은신",
    category: "키워드",
    definition:
      "정상 비용 대신 [A]를 내고, 내가 조종 중인 전장에 카드를 뒷면으로 숨긴다. 숨긴 턴에는 플레이 불가. 이후 Reaction 시점에 플레이 가능. 유닛은 그 전장에 등장해야 한다.",
    related: ["페이스다운 존", "Reaction"],
  },
  {
    term: "Ganking",
    reading: "갱킹",
    category: "키워드",
    definition:
      "기본 이동의 추가 방식. 보통은 베이스↔전장만 되지만, Ganking이 있으면 전장↔전장 이동도 가능. 추가 이동 횟수를 주는 건 아니다.",
    related: ["기본 이동"],
  },
  {
    term: "Deathknell",
    reading: "데스크넬",
    category: "키워드",
    definition:
      "유닛이 처치될 때 스스로의 죽음을 '보고' 발동하는 능력. 정리 단계에서 데미지 회복 전에 트리거가 기록된다.",
    related: ["처치", "정리"],
  },
  {
    term: "Legion",
    reading: "리전",
    category: "키워드",
    definition:
      "이번 턴에 카드를 (다른) 1장 플레이했으면 추가 효과를 얻는다. 토큰 플레이·능력 사용은 카드 플레이가 아니라 켜지 않는다.",
    related: ["토큰"],
  },
  {
    term: "Mighty",
    reading: "마이티",
    category: "키워드",
    definition:
      "Might가 5 이상인 유닛은 'Mighty'로 취급된다. 별도 키워드 표기 없이 조건만 충족하면 된다.",
    related: ["Might"],
  },
  {
    term: "Vision",
    reading: "비전",
    category: "키워드",
    definition:
      "메인 덱 맨 위 카드를 보고, 원한다면 재활용할 수 있는 능력.",
    related: ["재활용"],
  },
  {
    term: "Deflect",
    reading: "디플렉트",
    category: "키워드",
    definition:
      "특정 트리거를 체인에 올릴 때 지불하는 추가 비용. 예: Falling Star, Icathian Rain 의 반사 트리거.",
  },

  // ── 존 ────────────────────────────────────────────────
  {
    term: "체인",
    reading: "Chain",
    category: "존",
    definition:
      "카드가 플레이되거나 능력이 활성화될 때 임시로 존재하는 비보드 존. 한 번에 하나만. 가장 최근 항목이 먼저 해결된다(후입선출).",
    related: ["결투", "Reaction", "폐쇄 상태"],
  },
  {
    term: "트래시",
    reading: "Trash",
    category: "존",
    definition:
      "처치·버림·소모된 카드가 가는 곳. 순서 없음, 공개 정보. 탈진 시 덱으로 재활용된다.",
    related: ["처치", "탈진", "추방"],
  },
  {
    term: "추방",
    reading: "Banishment",
    category: "존",
    definition:
      "회수하기 더 어렵게 제거되거나, 효과 처리 중 임시로 카드를 잡아두는 공간. 공개 정보. 플레이하지 못한 카드가 남기도 한다.",
    related: ["트래시"],
  },
  {
    term: "페이스다운 존",
    reading: "Facedown Zone",
    category: "존",
    definition:
      "각 전장에 딸린 하위 공간. 최대 1장. 그 전장을 조종하는 플레이어만 카드를 숨길 수 있고, 지배권을 잃으면 다음 정리에 트래시로 간다.",
    related: ["Hidden", "전장"],
  },
  {
    term: "레전드 존 / 챔피언 존",
    reading: "Legend Zone / Champion Zone",
    category: "존",
    definition:
      "레전드 존은 챔피언 레전드가 게임 내내 머무는 곳(이동 불가). 챔피언 존은 지정 챔피언이 게임 시작 시 놓이는 곳으로, 여기서 일반 카드처럼 플레이할 수 있다.",
    related: ["챔피언 레전드", "지정 챔피언"],
  },
  {
    term: "포커스",
    reading: "Focus",
    category: "전투",
    definition:
      "결투(개방 상태)에서 적절한 시점에 행동할 수 있는 권한. 포커스를 얻으면 우선권도 얻는다. 스펠·능력을 쓰지 않고 패스하면 포커스가 넘어간다.",
    related: ["결투", "우선권"],
  },
  {
    term: "우선권",
    reading: "Priority",
    category: "전투",
    definition:
      "재량 행동(카드 플레이·능력 활성화 등)을 할 수 있는 유일·배타적 권리. 내 행동 페이즈, 또는 포커스를 얻었을 때, 또는 체인에서 내 항목 차례일 때 받는다.",
    related: ["포커스", "체인"],
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
