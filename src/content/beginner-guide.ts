/**
 * 리프트바운드 초보자 가이드 — Riftbound Core Rules(2025-12-01) 기반 요약.
 * 공식 룰의 축약본이며, 정확한 판정은 항상 최신 Core Rules / Watcher 를 따른다.
 */

export interface GuideStep {
  title: string;
  body: string;
  tip?: string;
}

export interface GuideSection {
  id: string;
  title: string;
  intro?: string;
  steps: GuideStep[];
}

export const GAME_GOAL = {
  headline: "먼저 8점을 얻으면 승리",
  detail:
    "전장(Battlefield)을 점령하거나 유지해 점수를 얻는다. 1v1은 8점, 2v2는 11점이 목표. 마지막 점수는 '점령'으로 얻으려면 그 턴에 다른 모든 전장을 이미 점수화했어야 하며, 아니면 대신 카드를 1장 뽑는다.",
};

export const COMPONENTS: { name: string; desc: string }[] = [
  { name: "챔피언 레전드 1장", desc: "덱의 도메인 정체성을 결정. 게임 내내 레전드 존에 고정." },
  { name: "메인 덱 40장 이상", desc: "유닛·장비·주문. 같은 이름 카드는 최대 3장. 도메인 정체성 준수." },
  { name: "지정 챔피언 1장", desc: "레전드와 같은 챔피언 태그를 가진 챔피언 유닛. 챔피언 존에서 시작." },
  { name: "룬 덱 정확히 12장", desc: "레전드 도메인에 맞는 룬. 메인 덱과 분리해서 셔플." },
  { name: "전장 카드", desc: "플레이 모드에 따라 장수 결정(보통 인원수만큼). 같은 이름 중복 불가." },
];

export const SETUP_SECTION: GuideSection = {
  id: "setup",
  title: "게임 준비",
  steps: [
    { title: "1. 레전드 배치", body: "챔피언 레전드를 레전드 존에 놓는다." },
    { title: "2. 지정 챔피언 배치", body: "지정 챔피언을 챔피언 존에 놓는다." },
    { title: "3. 전장 세팅", body: "플레이 모드가 정한 방식대로 전장을 전장 존에 배치한다." },
    { title: "4. 덱 셔플", body: "메인 덱과 룬 덱을 각각 따로 셔플해 해당 존에 놓는다." },
    { title: "5. 선/후공 결정", body: "공정한 무작위 방식으로 턴 순서를 정한다. 먼저 턴 플레이어가 되는 사람이 선공." },
    { title: "6. 4장 드로우", body: "각 플레이어가 카드 4장을 뽑는다." },
    {
      title: "7. 멀리건",
      body: "턴 순서대로, 손패에서 최대 2장을 골라 옆에 치우고 → 치운 만큼 새로 뽑은 뒤 → 치운 카드를 룬 덱이 아닌 메인 덱으로 재활용(recycle) 후 셔플.",
      tip: "확률 낮은 손패면 과감하게 2장 교체.",
    },
  ],
};

export const TURN_PHASES: {
  phase: string;
  short: string;
  detail: string;
}[] = [
  {
    phase: "각성 페이즈",
    short: "Awaken",
    detail: "내가 조종하는 준비 가능한 모든 게임 오브젝트를 준비(ready) 상태로 되돌린다 — 지친(exhausted) 유닛·룬·장비가 다시 세워진다.",
  },
  {
    phase: "시작 페이즈 · 유지",
    short: "Holding",
    detail: "내 턴 시작 시점에 내가 조종 중인 전장 1개당 1점 획득('유지'). 팀전에서 아군이 유지 중인 전장은 이 턴 내가 점수화할 수 없다.",
  },
  {
    phase: "충전 페이즈",
    short: "Channel",
    detail: "룬 덱에서 룬 2장을 충전(channel)한다. 12장을 다 충전했으면 더 이상 안 된다. 룬은 지쳐서 나오지 않는다(준비 상태).",
  },
  {
    phase: "드로우 페이즈",
    short: "Draw",
    detail: "카드 1장을 뽑는다. 덱이 비어 뽑을 수 없으면 '탈진(Burn Out)' — 트래시를 덱으로 재활용·셔플하고 상대 1명에게 1점을 준 뒤 그래도 1장 뽑는다. 드로우 페이즈가 끝나면 룬 풀이 비워진다.",
  },
  {
    phase: "행동 페이즈",
    short: "Action",
    detail: "정해진 구조가 없다. 원하는 만큼 행동: 카드 플레이, 능력 사용, 유닛 이동, 전투 개시 등. 내 턴에는 나만 행동할 수 있다(중립 개방 상태).",
  },
  {
    phase: "턴 종료 페이즈",
    short: "End",
    detail: "종료 시 효과 처리 → 정리(모든 유닛 데미지 회복) → '이번 턴' 효과 만료, 남은 에너지·파워 소멸 → 다음 플레이어로 턴 넘김.",
  },
];

export const RESOURCES_SECTION: GuideSection = {
  id: "resources",
  title: "자원 — 에너지와 파워",
  intro:
    "카드 비용의 왼쪽 위 숫자는 '에너지', 그 아래 색 기호는 '파워'다. 둘 다 룬에서 나온다.",
  steps: [
    {
      title: "에너지 (Energy)",
      body: "숫자 비용을 낸다. 색(도메인)이 없다. 룬을 지치게(exhaust) 하면 에너지 1이 나온다.",
    },
    {
      title: "파워 (Power)",
      body: "색 기호 비용을 낸다. 도메인이 있다. 룬을 재활용(recycle)하면 그 룬 도메인의 파워 1이 나온다 — 지친 룬도 재활용 가능.",
      tip: "한 룬을 같은 턴에 '지치게 해서 에너지 1' + '재활용해서 파워 1' 둘 다 뽑을 수 있다.",
    },
    {
      title: "룬 풀은 사라진다",
      body: "만들어 둔 에너지·파워는 드로우 페이즈 끝과 턴 끝에 모두 사라진다. 필요할 때 그때그때 만들어 쓴다.",
    },
    {
      title: "가속 (Accelerate)",
      body: "추가로 에너지 1 + 유닛 도메인 파워 1을 더 내면 유닛이 준비 상태로 등장한다(보통은 지쳐서 등장).",
    },
  ],
};

export const COMBAT_SECTION: GuideSection = {
  id: "combat",
  title: "이동 · 전투 · 결투",
  steps: [
    {
      title: "기본 이동 (Standard Move)",
      body: "행동 페이즈에 유닛을 지치게 해서 베이스↔전장으로 이동. 여러 유닛을 같은 목적지로 한 번에 이동 가능(모두 함께 지침). 지친 유닛은 기본 이동 불가.",
    },
    {
      title: "결투 (Showdown)",
      body: "빈 전장으로 이동해 지배권을 다투면 결투가 열린다. Action/Reaction 키워드가 있는 카드·능력만 번갈아 사용. 모두 패스하면 종료.",
    },
    {
      title: "전투 (Combat)",
      body: "서로 다른 두 플레이어의 유닛이 같은 전장에 있으면 전투 발생. 전투는 결투를 포함한다. 양측이 상대 유닛 전체 Might 합만큼 데미지를 서로 배분.",
    },
    {
      title: "데미지와 처치",
      body: "유닛에 쌓인 데미지가 Might 이상이면 처치된다. 데미지는 매 전투 종료 시·매 턴 종료 시 모두 회복된다.",
    },
    {
      title: "무승부",
      body: "양측 유닛이 모두 죽거나 양측 모두 살아남으면 무승부. 이때 공격 유닛은 베이스로 소환 회수되고 방어자가 지배권 유지(점수 없음).",
    },
  ],
};

export const SCORING_SECTION: GuideSection = {
  id: "scoring",
  title: "점수 얻기",
  steps: [
    {
      title: "점령 (Conquer)",
      body: "이미 조종하지 않았고 이번 턴 점수화하지 않은 전장의 지배권을 새로 얻으면 1점.",
    },
    {
      title: "유지 (Hold)",
      body: "내 턴이 시작될 때 이미 조종 중인 전장 1개당 1점(시작 페이즈에 자동).",
    },
    {
      title: "마지막 점수",
      body: "승리에 필요한 마지막 점수를 '점령'으로 얻으려면 그 턴에 다른 전장을 모두 점수화한 뒤여야 한다. 아니면 대신 카드 1장을 뽑는다. '유지'로는 마지막 점수를 바로 얻을 수 있다.",
    },
  ],
};

export const FIRST_GAME_TIPS: string[] = [
  "레전드의 능력과 도메인부터 확인 — 덱 전체의 방향이 여기서 나온다.",
  "룬은 매 턴 2장씩 늘어난다. 초반엔 자원이 빠듯하니 곡선을 낮게 잡자.",
  "점수는 전장에서 나온다. 유닛을 아끼다 전장을 계속 내주면 진다.",
  "'이번 턴' 버프·데미지는 턴이 끝나면 사라진다는 걸 계산에 넣자.",
  "Action/Reaction 이 없는 카드는 내 행동 페이즈, 결투·전투 밖에서만 쓸 수 있다.",
];
