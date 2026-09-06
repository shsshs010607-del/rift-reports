import { CARD_DOMAINS, CARD_TYPES, CARD_RARITIES, CARD_SETS } from "@/lib/constants";

/**
 * 카드 도메인 모델 (뷰/검색 계층 표준형).
 *
 * ─ 위치: 이 타입은 "앱이 카드를 이해하는 방식"을 정의한다.
 *   데이터 출처(오픈소스 JSON, 커뮤니티 REST API, 추후 Riot 공식 API)가 무엇이든
 *   서비스 어댑터(`@/lib/services/cardService`)가 전부 이 형태로 정규화한다.
 * ─ 구분: Supabase `cards` 테이블 Row(`@/lib/types/database` 의 `Card`)와는 별개다.
 *   그쪽은 snake_case 저장용 스키마, 이쪽은 camelCase 표현용 모델.
 *   (DB 를 카드 소스로 쓰는 어댑터를 나중에 추가하면 거기서 매핑하면 된다.)
 */

// ── 열거형: constants.ts 의 단일 정의에서 파생 (중복 방지) ──────────────

/** 카드 색(도메인). 다색 카드는 복수. */
export type CardDomain = (typeof CARD_DOMAINS)[number]["slug"];

/** 카드 종류. */
export type CardType = (typeof CARD_TYPES)[number]["slug"];

/** 확장팩(세트) 코드. */
export type CardSetCode = (typeof CARD_SETS)[number]["code"];

/**
 * 레어도. `CARD_RARITIES` 의 슬러그가 표준값이지만,
 * 소스마다 어휘가 달라 그 외 문자열도 허용한다(자동완성은 유지).
 */
export type CardRarity = (typeof CARD_RARITIES)[number]["slug"] | (string & {});

/** 앱이 지원하는 로케일. */
export type Locale = "ko" | "en";

/**
 * 카드 데이터 출처 식별자.
 * `NEXT_PUBLIC_DATA_SOURCE` 환경변수 값과 1:1 로 매핑된다.
 */
export type CardDataSource = "opensource" | "official-riot";

// ── 로케일 대응 구조 ──────────────────────────────────────────────

/** 한 로케일에서의 카드 텍스트 묶음. */
export interface CardLocalizedText {
  /** 카드명. */
  name: string;
  /** 룰 텍스트(효과). 없으면 빈 문자열. */
  text: string;
  /** 감성 문구(flavor). 선택. */
  flavor?: string;
  /** 이 로케일의 카드 이미지(한글 인쇄판 등). 없으면 대표 imageUrl 사용. */
  imageUrl?: string | null;
}

/**
 * 로케일별 원문 모음.
 * - `en` 은 항상 존재한다(공식 영문 canonical — 안정적). 카드 거래소 등 영문이 필요한 곳은 이걸 쓴다.
 * - `ko` 는 한글 번역이 있는 카드만 채워진다(리프트나루 데이터 기준). 없으면 en 으로 폴백.
 */
export interface CardLocalization {
  en: CardLocalizedText;
  ko?: CardLocalizedText;
}

// ── 카드 본체 ────────────────────────────────────────────────────

export interface Card {
  /**
   * 출처 불문 안정적인 고유 식별자.
   * 같은 실물 카드는 어떤 소스에서 와도 같은 id 를 갖도록 만든다(권장: `${setCode}-${collectorNumber}`).
   */
  id: string;

  /** 세트(집합) 코드. 예: "OGN". */
  setCode: string;
  /** 세트 내 수집 번호. 없으면 null. */
  collectorNumber: string | null;

  /** 표시용 대표 이름 = `localization.ko?.name ?? localization.en.name`. */
  name: string;
  /** 표시용 대표 룰 텍스트. */
  text: string;

  /** 자원 코스트. 코스트 개념이 없는 카드(룬/전장 등)는 null. */
  cost: number | null;
  /** 파워/공격력(Riftbound 의 might). 유닛·챔피언 외에는 null. */
  power: number | null;
  /** 별도 체력/방어 스탯이 있으면. 없으면 null. */
  toughness: number | null;

  type: CardType;
  /** 카드 방향. 전장은 landscape, 그 외 portrait. */
  orientation: "portrait" | "landscape";
  /** 세부 태그(지역, 종족, 키워드 등). */
  subtypes: string[];
  /** 카드가 속한 도메인(색). 다색 가능, 무색은 빈 배열. */
  domains: CardDomain[];
  rarity: CardRarity;

  /** 카드 아트 URL. 소스가 이미지를 안 주면 null. */
  imageUrl: string | null;
  /** 일러스트레이터. 모르면 null. */
  artist: string | null;

  /** 로케일별 원문(위 설명 참고). */
  localization: CardLocalization;

  /** 이 레코드가 어느 소스에서 만들어졌는지(디버깅·캐시 무효화용). */
  source: CardDataSource;
}

// ── 검색/필터 질의 ───────────────────────────────────────────────

/**
 * 카드 검색 질의.
 * `/cards` 페이지 및 `/api/cards` 라우트의 URL searchParams 계약과 1:1 대응한다.
 * 모든 필드는 선택 — 아무것도 없으면 "전체"로 해석한다.
 */
export interface CardSearchQuery {
  /** 자유 텍스트. 카드명 + 룰 텍스트를 대상으로 한/영 부분일치 검색. */
  q?: string;
  domain?: CardDomain;
  type?: CardType;
  rarity?: CardRarity;
  /** 정확히 일치하는 코스트. */
  cost?: number;
  /** 세트 코드로 한정. */
  setCode?: string;
  /** 페이지네이션(기본: 전체). */
  limit?: number;
  offset?: number;
}

// ── 헬퍼 ────────────────────────────────────────────────────────

/**
 * 주어진 로케일 기준으로 카드 텍스트를 고른다.
 * 요청 로케일 번역이 없으면 영문으로 자동 폴백한다.
 */
export function resolveCardText(card: Card, locale: Locale = "ko"): CardLocalizedText {
  if (locale === "ko" && card.localization.ko) return card.localization.ko;
  return card.localization.en;
}

/** constants 슬러그 화이트리스트 (런타임 검증용). */
export const CARD_DOMAIN_SLUGS = CARD_DOMAINS.map((d) => d.slug) as readonly CardDomain[];
export const CARD_TYPE_SLUGS = CARD_TYPES.map((t) => t.slug) as readonly CardType[];
export const CARD_RARITY_SLUGS = CARD_RARITIES.map((r) => r.slug) as readonly CardRarity[];
export const CARD_SET_CODES = CARD_SETS.map((s) => s.code) as readonly CardSetCode[];
