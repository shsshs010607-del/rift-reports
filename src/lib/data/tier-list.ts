import type { Tier } from "@/lib/types/database";

/**
 * 덱 티어리스트 데이터 (레전드 기준).
 * 완성 덱(decks 테이블) 연동 전까지, 카드 정보의 레전드로 구성한다.
 * - `legendEn`: 카드 서비스에서 레전드를 찾는 키 (localization.en.name, "(Starter)" 포함 정확 일치)
 * - 카드를 누르면 덱 공략 게시판으로 이동
 */
export interface TierDeck {
  id: string;
  tier: Tier;
  name: string;
  subtitle: string;
  legendEn: string;
  keyCard: string;
  /** 덱 공략 글 (커뮤니티 post id). 없으면 덱 공략 게시판으로. */
  guidePostId?: string;
}

/** scripts/seed-deck-guides.ts 가 생성한 공략 글 매핑 */
const GUIDE: Record<string, string> = {
  yi: "ade266c2-84a2-4bbc-9415-d92911845cf7",
  kaisa: "52158414-b0e5-4cba-a4d0-e0230232f3f3",
  viktor: "d508cd97-d1ad-4538-a6ee-8bf990e21a5c",
  annie: "a90034cf-a3db-476e-ac5d-ebd6b3fd8d55",
  sett: "432cb664-e1ff-4a25-935e-ac03d0053ff1",
  mf: "ca59e638-ecb0-475e-b3ea-0d191c83002a",
  yasuo: "452b18d2-b898-4c64-8665-6ce1d009f5cc",
  darius: "a710f367-f320-4dc3-a249-6d090c681a84",
  volibear: "d93749a7-a54e-43a6-a8a6-591b291b88e9",
  ahri: "2c810fc8-a235-42a2-b73b-e3141b1b75ce",
  leesin: "e2e6461e-1acd-4ab3-8544-a32c3aa8e236",
  leona: "7d1fddc2-00c6-4b34-b3ed-24f484758e2a",
  jinx: "5accf479-7521-430f-a502-03e9487afe63",
  teemo: "d7a7a401-fe28-40bc-9cf9-a0dadddcfa44",
  garen: "ef16bffc-fa3f-4447-8907-e150a76179ef",
};

const RAW_DECKS: Omit<TierDeck, "guidePostId">[] = [
  // ── S ──────────────────────────────────────────────
  {
    id: "yi",
    tier: "S",
    name: "마스터 이",
    subtitle: "우주 검사 연계 폭딜",
    legendEn: "Master Yi - Wuju Bladesman (Starter)",
    keyCard: "마스터 이",
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
    id: "annie",
    tier: "A",
    name: "애니",
    subtitle: "분노 화력·직접 피해",
    legendEn: "Annie - Dark Child (Starter)",
    keyCard: "애니",
  },
  {
    id: "sett",
    tier: "A",
    name: "세트",
    subtitle: "육체 미드레인지",
    legendEn: "Sett - The Boss",
    keyCard: "세트",
  },
  {
    id: "mf",
    tier: "A",
    name: "미스 포츈",
    subtitle: "광역 사격 압박",
    legendEn: "Miss Fortune - Bounty Hunter",
    keyCard: "미스 포츈",
  },

  // ── B ──────────────────────────────────────────────
  {
    id: "yasuo",
    tier: "B",
    name: "야스오",
    subtitle: "기절·반격 콤보",
    legendEn: "Yasuo - Unforgiven",
    keyCard: "야스오",
  },
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

  // ── C ──────────────────────────────────────────────
  {
    id: "ahri",
    tier: "C",
    name: "아리",
    subtitle: "혼돈 주문 연계",
    legendEn: "Ahri - Nine-Tailed Fox",
    keyCard: "아리",
  },
  {
    id: "leesin",
    tier: "C",
    name: "리 신",
    subtitle: "침착 킥 콤보",
    legendEn: "Lee Sin - Blind Monk",
    keyCard: "리 신",
  },
  {
    id: "leona",
    tier: "C",
    name: "레오나",
    subtitle: "질서 방어 컨트롤",
    legendEn: "Leona - Radiant Dawn",
    keyCard: "레오나",
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
    subtitle: "지혜·질서 주문 컨트롤",
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

export const TIER_DECKS: TierDeck[] = RAW_DECKS.map((d) => ({
  ...d,
  guidePostId: GUIDE[d.id],
}));

export const TIER_META: Record<Tier, { label: string; note: string }> = {
  S: { label: "S", note: "최상위" },
  A: { label: "A", note: "우수" },
  B: { label: "B", note: "안정" },
  C: { label: "C", note: "유동" },
  Z: { label: "Z", note: "비주류" },
};
