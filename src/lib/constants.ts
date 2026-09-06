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
  { slug: "riftbound", label: "리프트바운드 게시판", desc: "자유 주제 · 잡담 · 질문" },
  { slug: "report", label: "리프트 리포트", desc: "메타 분석 · 뉴스 · 번역" },
  { slug: "deck-guide", label: "덱 공략 게시판", desc: "덱 리스트 · 운영법 · 매치업" },
  { slug: "tournament", label: "대회 정보", desc: "대회 소식 · 후기 · 참가 모집" },
  { slug: "recruit", label: "구인구직", desc: "팀원 · 길드 · 듀오 · 스태프" },
] as const;

export type CommunityCategorySlug = (typeof COMMUNITY_CATEGORIES)[number]["slug"];

/** 인기글 탭 기준: 최근 N일 내 추천 M개 이상 */
export const POPULAR_POST = { days: 30, minLikes: 3 } as const;

export const POSTS_PER_PAGE = 20;

// ── 시세 (JustTCG) ──────────────────────────────────────
export const PRICE = {
  /** JustTCG 게임 식별자 (2026-09 확인). */
  justtcgGame: "riftbound-league-of-legends-trading-card-game",
  /**
   * 동기화 대상 세트 (JustTCG set id). 무료 플랜은 페이지당 20장 제한이라
   * 전체(11세트·1500장+)를 자주 돌리면 월 1,000콜을 넘긴다 → 주요 컨스트럭티드 세트만.
   * 프로모/실드 제외. 신규 세트 나오면 여기 추가.
   */
  sets: [
    "origins-riftbound-league-of-legends-trading-card-game",
    "origins-proving-grounds-riftbound-league-of-legends-trading-card-game",
    "spiritforged-riftbound-league-of-legends-trading-card-game",
    "unleashed-riftbound-league-of-legends-trading-card-game",
    "vendetta-riftbound-league-of-legends-trading-card-game",
  ],
  /** 무료 플랜 페이지 크기 제한. */
  pageLimit: 20,
  /** 우리 DB 스냅샷 보관 기간(일). */
  historyDays: 90,
  /** 갱신 주기 참고값(시간) — 실제 스케줄은 .github/workflows/sync-prices.yml.
   *  ~1,250장 / 20 ≈ 63콜/회. 월 1,000콜 → 2일마다 (약 15회/월). */
  refreshHours: 48,
  /** "N시간 전 기준" 경고 임계값. */
  staleHours: 60,
} as const;

export const CARD_CONDITIONS = [
  { slug: "NM", label: "니어민트" },
  { slug: "LP", label: "라이트플레이" },
  { slug: "MP", label: "모더레이트플레이" },
  { slug: "HP", label: "헤비플레이" },
  { slug: "DM", label: "손상" },
] as const;

export const PRINT_LANGUAGES = [
  { slug: "en", label: "영어" },
  { slug: "ja", label: "일본어" },
  { slug: "zh", label: "중국어" },
  { slug: "ko", label: "한국어" },
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

// 리프트바운드 6개 도메인 (Core Rules 133 기준)
export const CARD_DOMAINS = [
  { slug: "fury", label: "분노", en: "Fury", short: "R", color: "#e4483d" },
  { slug: "calm", label: "침착", en: "Calm", short: "G", color: "#3fa34d" },
  { slug: "mind", label: "지혜", en: "Mind", short: "B", color: "#3b82f6" },
  { slug: "body", label: "육체", en: "Body", short: "O", color: "#e8863d" },
  { slug: "chaos", label: "혼돈", en: "Chaos", short: "P", color: "#a855f7" },
  { slug: "order", label: "질서", en: "Order", short: "Y", color: "#eab308" },
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
