import type { Tier } from "@/lib/types/database";

/**
 * 덱 티어리스트 데이터 (레전드 기준).
 * 완성 덱(decks 테이블) 연동 전까지, 카드 정보의 레전드로 구성한다.
 * - `legendEn`: 카드 서비스에서 레전드를 찾는 키 (localization.en.name, "(Starter)" 포함 정확 일치)
 * - 카드를 누르면 메타 덱(`/decks`)으로 이동
 */
export interface TierDeck {
  id: string;
  tier: Tier;
  name: string;
  subtitle: string;
  legendEn: string;
  keyCard: string;
  /**
   * 특정 meta_decks 행에 고정 연결 (id). 같은 레전드로 타일이 여러 개일 때
   * (예: 마스터 이 "오로라 마이"/"미드레인지 마이") getBestMetaDeckByLegend 의
   * "레전드당 1개" 매칭 대신 정확히 이 덱을 쓰게 한다.
   */
  metaDeckId?: string;
}

const RAW_DECKS: TierDeck[] = [
  // ── S ──────────────────────────────────────────────
  {
    id: "yi",
    tier: "A",
    name: "오로라 마이",
    subtitle: "오로라 우주 검사 연계 폭딜",
    legendEn: "Master Yi - Wuju Bladesman (Starter)",
    keyCard: "마스터 이",
    metaDeckId: "cad062f9-1160-4b1f-b73b-2f0a4ec250e5",
  },
  {
    id: "yi-mid",
    tier: "S",
    name: "미드레인지 마이",
    subtitle: "안정적인 중속 마스터 이",
    legendEn: "Master Yi - Wuju Bladesman (Starter)",
    keyCard: "마스터 이",
    metaDeckId: "1b49b41e-6015-4c8a-a480-366b363d2ece",
  },
  {
    id: "kaisa",
    tier: "S",
    name: "카이사",
    subtitle: "공허 성장·후반 캐리",
    legendEn: "Kai'Sa - Daughter of the Void",
    keyCard: "카이사",
  },
  {
    id: "viktor",
    tier: "S",
    name: "빅토르",
    subtitle: "아케인 자원 램프",
    legendEn: "Viktor - Herald of the Arcane",
    keyCard: "빅토르",
  },

  // ── A ──────────────────────────────────────────────
  {
    id: "leona",
    tier: "A",
    name: "레오나",
    subtitle: "질서 방어 컨트롤",
    legendEn: "Leona - Radiant Dawn",
    keyCard: "레오나",
  },
  {
    id: "sett",
    tier: "A",
    name: "세트",
    subtitle: "신체 미드레인지",
    legendEn: "Sett - The Boss",
    keyCard: "세트",
  },
  {
    id: "ahri",
    tier: "A",
    name: "아리",
    subtitle: "혼돈 주문 연계",
    legendEn: "Ahri - Nine-Tailed Fox",
    keyCard: "아리",
  },

  // ── B ──────────────────────────────────────────────
  {
    id: "darius",
    tier: "B",
    name: "다리우스",
    subtitle: "녹서스 어그로",
    legendEn: "Darius - Hand of Noxus",
    keyCard: "다리우스",
  },
  {
    id: "volibear",
    tier: "B",
    name: "볼리베어",
    subtitle: "폭풍 지속 전개",
    legendEn: "Volibear - Relentless Storm",
    keyCard: "볼리베어",
  },
  {
    id: "annie",
    tier: "B",
    name: "애니",
    subtitle: "분노 화력·직접 피해",
    legendEn: "Annie - Dark Child (Starter)",
    keyCard: "애니",
  },
  {
    id: "mf",
    tier: "B",
    name: "미스 포츈",
    subtitle: "광역 사격 압박",
    legendEn: "Miss Fortune - Bounty Hunter",
    keyCard: "미스 포츈",
  },

  // ── C ──────────────────────────────────────────────
  {
    id: "yasuo",
    tier: "C",
    name: "야스오",
    subtitle: "기절·반격 콤보",
    legendEn: "Yasuo - Unforgiven",
    keyCard: "야스오",
  },
  {
    id: "leesin",
    tier: "C",
    name: "리 신",
    subtitle: "평정 킥 콤보",
    legendEn: "Lee Sin - Blind Monk",
    keyCard: "리 신",
  },
  {
    id: "jinx",
    tier: "C",
    name: "징크스",
    subtitle: "혼돈 폭딜 피니시",
    legendEn: "Jinx - Loose Cannon",
    keyCard: "징크스",
  },
  {
    id: "lux",
    tier: "C",
    name: "럭스",
    subtitle: "정신·질서 주문 컨트롤",
    legendEn: "Lux - Lady of Luminosity (Starter)",
    keyCard: "럭스",
  },

  // ── Z ──────────────────────────────────────────────
  {
    id: "teemo",
    tier: "Z",
    name: "티모",
    subtitle: "함정 견제 (표본 부족)",
    legendEn: "Teemo - Swift Scout",
    keyCard: "티모",
  },
  {
    id: "garen",
    tier: "Z",
    name: "가렌",
    subtitle: "입문자 덱 (표본 부족)",
    legendEn: "Garen - Might of Demacia (Starter)",
    keyCard: "가렌",
  },
];

export const TIER_DECKS: TierDeck[] = RAW_DECKS;

export const TIER_META: Record<Tier, { label: string; note: string }> = {
  S: { label: "S", note: "최상위" },
  A: { label: "A", note: "우수" },
  B: { label: "B", note: "안정" },
  C: { label: "C", note: "유동" },
  Z: { label: "Z", note: "비주류" },
};
