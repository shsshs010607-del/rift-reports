export const SITE = {
  name: "리프트 리포트",
  nameEn: "Rift Report",
  description: "리프트바운드(Riftbound) TCG 공략 · 티어리스트 · 카드 DB · 커뮤니티",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
} as const;

export const NAV_ITEMS = [
  { href: "/", label: "홈" },
  { href: "/tiers", label: "덱 티어리스트" },
  { href: "/cards", label: "카드 정보" },
  { href: "/rules", label: "룰 & 용어" },
  { href: "/community", label: "커뮤니티" },
  { href: "/trading", label: "카드 거래" },
  { href: "/tournaments", label: "대회 정보" },
] as const;

export const TIERS = ["S", "A", "B", "C"] as const;
export type Tier = (typeof TIERS)[number];

export const TIER_STYLES: Record<
  Tier,
  { label: string; badge: string; headerBg: string; dot: string }
> = {
  S: { label: "S", badge: "tier-badge tier-badge-s", headerBg: "bg-amber", dot: "bg-amber" },
  A: { label: "A", badge: "tier-badge tier-badge-a", headerBg: "bg-tier-a", dot: "bg-tier-a" },
  B: { label: "B", badge: "tier-badge tier-badge-b", headerBg: "bg-emerald", dot: "bg-emerald" },
  C: { label: "C", badge: "tier-badge tier-badge-c", headerBg: "bg-tier-c", dot: "bg-tier-c" },
};

export const COMMUNITY_CATEGORIES = [
  { slug: "free", label: "자유" },
  { slug: "guide", label: "공략/팁" },
  { slug: "deck-analysis", label: "덱 분석" },
] as const;

export const TRADING_CATEGORIES = [
  { slug: "sell", label: "팝니다" },
  { slug: "buy", label: "삽니다" },
  { slug: "trade", label: "교환" },
] as const;

export const TRADE_CONDITIONS = [
  { slug: "mint", label: "미개봉/민트" },
  { slug: "near-mint", label: "니어민트" },
  { slug: "lightly-played", label: "라이트플레이" },
  { slug: "played", label: "플레이드" },
  { slug: "damaged", label: "손상" },
] as const;

export const TRADE_STATUS = [
  { slug: "open", label: "진행 중" },
  { slug: "reserved", label: "예약 중" },
  { slug: "closed", label: "완료" },
] as const;

export const TOURNAMENT_STATUS = [
  { slug: "upcoming", label: "진행 예정" },
  { slug: "ongoing", label: "진행 중" },
  { slug: "finished", label: "종료" },
] as const;

// 리프트바운드 카드 도메인 (공식 용어 기준으로 추후 조정)
export const CARD_DOMAINS = [
  { slug: "fury", label: "분노", color: "#e0533d" },
  { slug: "calm", label: "평온", color: "#4aa3c7" },
  { slug: "mind", label: "지혜", color: "#9b7bd6" },
  { slug: "body", label: "육체", color: "#c99b52" },
  { slug: "chaos", label: "혼돈", color: "#c74a86" },
  { slug: "order", label: "질서", color: "#c9c34a" },
] as const;

export const CARD_TYPES = [
  { slug: "champion", label: "챔피언" },
  { slug: "unit", label: "유닛" },
  { slug: "spell", label: "주문" },
  { slug: "gear", label: "장비" },
  { slug: "rune", label: "룬" },
  { slug: "battlefield", label: "전장" },
  { slug: "legend", label: "레전드" },
] as const;

export const CARD_RARITIES = [
  { slug: "common", label: "커먼" },
  { slug: "uncommon", label: "언커먼" },
  { slug: "rare", label: "레어" },
  { slug: "epic", label: "에픽" },
  { slug: "overnumbered", label: "오버넘버드" },
] as const;
