export const SITE = {
  name: "리바지지",
  nameEn: "RIBA.GG",
  description:
    "리프트바운드(Riftbound) TCG 정보 허브 — 덱 티어리스트 · 카드 DB · 덱 시뮬레이터 · 시세 · 매장 대회 · 커뮤니티",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://riba.gg",
  /** 커뮤니티 채널 — 실제 URL 확정 전 "#" (그 사이엔 "준비 중" 표시) */
  discord: "#" as string,
  youtube: "#" as string,
  instagram: "#" as string,
  naverCafe: "https://cafe.naver.com/riftboundmarketplace" as string,
  /** 네이버 카페 거래 게시판(카드 판매) 바로가기 */
  naverCafeTrade: "https://cafe.naver.com/f-e/cafes/31788328/menus/14?viewType=L" as string,
  /** 네이버 카페 카드 판매 게시판 글쓰기 (레거시 URL — 신형 에디터로 리다이렉트) */
  naverCafeTradeWrite:
    "https://cafe.naver.com/ArticleWrite.nhn?clubid=31788328&menuid=14" as string,
  /** 리프트바운드 공식 채널 (Riot Games) */
  officialYoutube: "https://www.youtube.com/@riftbound" as string,
  officialSite: "https://riftbound.leagueoflegends.com/" as string,
  officialHowToPlay: "https://www.youtube.com/watch?v=2koNsAKsipc" as string,
} as const;

/**
 * 홈에 노출할 리프트바운드 영상 (수동 큐레이션).
 * id = YouTube videoId. titleKo = 한글 번역 제목. 새 영상은 여기 맨 위에 추가.
 */
export const RIFTBOUND_VIDEOS = [
  {
    id: "2koNsAKsipc",
    titleKo: "11분 만에 배우는 리프트바운드 룰",
    channel: "Good Time Society",
  },
  {
    id: "BSr32eiUeyU",
    titleKo: "리프트바운드 공개 트레일러",
    channel: "Riftbound (공식)",
  },
] as const;

/**
 * Google AdSense. 두 값이 모두 있어야 광고가 렌더된다 (없으면 아무것도 안 나옴).
 *   NEXT_PUBLIC_ADSENSE_CLIENT      = "ca-pub-0000000000000000"
 *   NEXT_PUBLIC_ADSENSE_FOOTER_SLOT = "0000000000"  (푸터 광고 단위 슬롯 ID)
 */
export const ADSENSE = {
  // 퍼블리셔 ID·슬롯 ID 는 공개 값이라 기본값으로 박아둔다. (env 로 덮어쓰기 가능)
  client: process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? "ca-pub-5310171214105326",
  footerSlot: process.env.NEXT_PUBLIC_ADSENSE_FOOTER_SLOT ?? "2066782718",
} as const;

/** Kakao Map JavaScript 키. 없으면 지도 대신 목록만. (콘솔에서 웹 도메인 등록 필수) */
export const KAKAO_MAP_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY ?? "";

/** 상단바 1행 — 카드·덱·거래·커뮤니티 (플레이/참여 도구). */
export const NAV_PRIMARY = [
  { href: "/cards", label: "카드 정보" },
  { href: "/deck-simulator", label: "덱 시뮬레이터" },
  { href: "/tiers", label: "덱 티어리스트" },
  { href: "/trading", label: "트레이딩" },
  { href: "/community", label: "커뮤니티" },
] as const;

/** 상단바 2행 — 가이드·룰·지역 (레퍼런스/오프라인). */
export const NAV_SECONDARY = [
  { href: "/rules", label: "초보자 가이드" },
  { href: "/rules/reference", label: "상세 룰" },
  { href: "/glossary", label: "용어" },
  { href: "/shops", label: "주변 매장" },
  { href: "/tournaments", label: "다가오는 대회" },
] as const;

/** 하위호환 — 푸터 등에서 참조. */
export const NAV_ITEMS = [...NAV_PRIMARY, ...NAV_SECONDARY] as const;

/** 대한민국 시/도 (카드샵 지역 필터). */
export const KR_SIDO = [
  "서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종",
  "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주",
] as const;
export type KrSido = (typeof KR_SIDO)[number];

export const TIERS = ["S", "A", "B", "C", "Z"] as const;
export type Tier = (typeof TIERS)[number];

export const TIER_STYLES: Record<
  Tier,
  { label: string; badge: string; headerBg: string; dot: string }
> = {
  S: { label: "S", badge: "tier-badge tier-badge-s", headerBg: "bg-rose-500", dot: "bg-rose-500" },
  A: { label: "A", badge: "tier-badge tier-badge-a", headerBg: "bg-orange-500", dot: "bg-orange-500" },
  B: { label: "B", badge: "tier-badge tier-badge-b", headerBg: "bg-green-500", dot: "bg-green-500" },
  C: { label: "C", badge: "tier-badge tier-badge-c", headerBg: "bg-sky-500", dot: "bg-sky-500" },
  Z: {
    label: "Z",
    badge: "tier-badge bg-surface-container text-on-surface-variant",
    headerBg: "bg-slate-400",
    dot: "bg-slate-400",
  },
};

export const COMMUNITY_CATEGORIES = [
  { slug: "report", label: "메타 리포트", desc: "메타 분석 · 뉴스 · 번역" },
  { slug: "riftbound", label: "리프트바운드 게시판", desc: "자유 주제 · 잡담 · 질문" },
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
    // 카드 DB 스코프(OGN·OGS 스탠다드)와 동일하게 유지. 신규 세트 편입 시 여기 추가.
    "origins-riftbound-league-of-legends-trading-card-game",
    "origins-proving-grounds-riftbound-league-of-legends-trading-card-game",
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
  { slug: "gear", label: "도구" },
  { slug: "rune", label: "룬" },
  { slug: "battlefield", label: "전장" },
  { slug: "legend", label: "레전드" },
] as const;

/**
 * 지원 확장팩(세트) — Riftcodex set_id 기준.
 *
 * 지금은 한글판이 준비된 **OGN(오리진스) + OGS(프루빙 그라운드)** 만 취급한다.
 * 이 목록이 카드 DB 에 실제로 담기는 세트를 결정한다 — cardService 가 여기 없는
 * 세트의 카드를 걸러낸다. 새 세트 한글화가 끝나면 여기 추가 + `npm run sync:cards` 재실행.
 *
 * 대기 중(미지원): SFD 스피릿포지드 · UNL 언리쉬드 · VEN 벤데타 · OPP/PR/JDG 프로모
 */
export const CARD_SETS = [
  { code: "OGN", label: "오리진스", name: "Origins" },
  { code: "OGS", label: "프루빙 그라운드", name: "Origins: Proving Grounds" },
] as const;

/**
 * 리프트바운드 덱 구성 규칙.
 *  - 레전드 1 · 지정 챔피언 1 · 메인덱 39~59장(카드 이름당 최대 3장) · 룬덱 12 · 전장 3
 *  - 오프닝 핸드 4장, 멀리건 1회(최대 2장 덱 아래로).
 */
export const DECK_RULES = {
  mainMin: 39,
  mainMax: 59,
  maxCopies: 3,
  runeCount: 12,
  battlefieldCount: 3,
  legendCount: 1,
  openingHand: 4,
  mulliganMax: 2,
} as const;

/**
 * 게임상 레어도 (필터용). 원형(기본) 인쇄판 기준.
 * 오버넘버드 · 프로모 · 쇼케이스는 별도 필터가 아니라 "변형 인쇄판(printing)"으로 취급 —
 * 기본 카드를 눌러 모달에서 비교한다. (CardPrinting.treatment)
 */
export const CARD_RARITIES = [
  { slug: "common", label: "커먼" },
  { slug: "uncommon", label: "언커먼" },
  { slug: "rare", label: "레어" },
  { slug: "epic", label: "에픽" },
] as const;

/** 변형 인쇄판 표기 (모달 비교용 라벨). */
export const CARD_TREATMENTS = {
  base: "기본",
  alt_art: "얼터네이트 아트",
  showcase: "쇼케이스",
  signature: "시그니처",
  overnumbered: "오버넘버드",
  promo: "프로모",
} as const;
export type CardTreatment = keyof typeof CARD_TREATMENTS;
