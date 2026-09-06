import type { Tier } from "@/lib/types/database";

/**
 * 임시 덱 티어리스트 데이터.
 * 아직 완성 덱(decks 테이블)이 없어서, 카드 정보에 있는 레전드로 채워둔 플레이스홀더다.
 * - `legendEn`: 카드 서비스에서 레전드 카드를 찾는 키 (영문명)
 * - 카드를 누르면 덱 공략 게시판으로 이동 (나중에 개별 덱 상세로 교체)
 */
export interface TierDeck {
  id: string;
  tier: Tier;
  name: string;
  subtitle: string;
  /** 레전드 영문명 (카드 조회 키). */
  legendEn: string;
  /** 핵심 카드/챔피언 표기. */
  keyCard: string;
}

export const TIER_DECKS: TierDeck[] = [
  {
    id: "jinx-chaos-burst",
    tier: "S",
    name: "징크스 혼돈 폭딜",
    subtitle: "주문 연계로 폭발적인 피니시",
    legendEn: "Jinx - Loose Cannon",
    keyCard: "징크스",
  },
  {
    id: "darius-noxus-aggro",
    tier: "S",
    name: "다리우스 녹서스 어그로",
    subtitle: "초반 압박 & 질서 자원 운영",
    legendEn: "Darius - Hand of Noxus",
    keyCard: "다리우스",
  },
  {
    id: "leesin-calm-combo",
    tier: "A",
    name: "리 신 침착 콤보",
    subtitle: "정확한 킥 연계로 승부",
    legendEn: "Lee Sin - Blind Monk",
    keyCard: "리 신",
  },
  {
    id: "leona-order-control",
    tier: "A",
    name: "레오나 질서 컨트롤",
    subtitle: "방어 전개 후 후반 굳히기",
    legendEn: "Leona - Radiant Dawn",
    keyCard: "레오나",
  },
  {
    id: "viktor-arcane-ramp",
    tier: "B",
    name: "빅토르 아케인 램프",
    subtitle: "자원 가속 후 대형 주문",
    legendEn: "Viktor - Herald of the Arcane",
    keyCard: "빅토르",
  },
  {
    id: "teemo-chaos-trap",
    tier: "B",
    name: "티모 혼돈 함정",
    subtitle: "지속 피해 & 필드 견제",
    legendEn: "Teemo - Swift Scout",
    keyCard: "티모",
  },
  {
    id: "sett-body-midrange",
    tier: "C",
    name: "세트 육체 미드레인지",
    subtitle: "단단한 전개, 표본 부족",
    legendEn: "Sett - The Boss",
    keyCard: "세트",
  },
];

export const TIER_META: Record<Tier, { label: string; note: string }> = {
  S: { label: "S", note: "최상위" },
  A: { label: "A", note: "우수" },
  B: { label: "B", note: "안정" },
  C: { label: "C", note: "유동" },
};
