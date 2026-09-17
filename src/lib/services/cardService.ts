import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

import {
  type Card,
  type CardDataSource,
  type CardDomain,
  type CardLocalizedText,
  type CardPrinting,
  type CardRarity,
  type CardSearchQuery,
  type CardSupertype,
  type CardType,
  CARD_DOMAIN_SLUGS,
  CARD_RARITY_SLUGS,
  CARD_SET_CODES,
  CARD_TYPE_SLUGS,
} from "@/lib/types/card";
import { CARD_DOMAINS } from "@/lib/constants";
import { isBanned, BAN_TAG } from "@/lib/cards/banned";

/** 카드 DB 에 담을 세트 화이트리스트 (constants.CARD_SETS). 그 외 세트 카드는 로드 시 제외. */
const SUPPORTED_SETS = new Set<string>(CARD_SET_CODES);

/**
 * 카드 데이터 접근 계층 (어댑터 패턴).
 *
 * ┌─ ICardService ............ 상위(페이지/라우트)가 의존하는 유일한 추상 (SOLID: DIP)
 * ├─ OpenSourceCardService ... 현재 사용. playriftbound.com 공식 카드 갤러리 + 로컬 JSON 스냅샷 폴백
 * ├─ OfficialRiotCardService . 스텁. Riot Production API 승인되면 여기만 채우면 됨
 * └─ getCardService() ........ NEXT_PUBLIC_DATA_SOURCE 로 구현체를 선택하는 팩토리
 *
 * 소스를 바꿔도 상위 코드는 그대로 — 환경변수 한 줄(NEXT_PUBLIC_DATA_SOURCE=official-riot)만 바꾼다.
 */

const DEFAULT_REVALIDATE = 60 * 60 * 24; // 24h

// ════════════════════════════════════════════════════════════════════
//  에러 타입
// ════════════════════════════════════════════════════════════════════

/**
 * 카드 서비스 계층에서 발생한 오류.
 * 상위에서 `instanceof CardServiceError` 로 잡아 빈 상태/에러 UI 를 판단한다.
 */
export class CardServiceError extends Error {
  constructor(
    message: string,
    /** 원인 오류(네트워크 예외, 파싱 실패 등). */
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "CardServiceError";
  }
}

// ════════════════════════════════════════════════════════════════════
//  인터페이스
// ════════════════════════════════════════════════════════════════════

export interface ICardService {
  /** 전체 카드 목록. (내부적으로 캐시 가능) */
  getAllCards(): Promise<Card[]>;
  /** id 로 단건 조회. 없으면 null. */
  getCardById(id: string): Promise<Card | null>;
  /** 질의 조건으로 필터링된 목록. */
  searchCards(query: CardSearchQuery): Promise<Card[]>;
}

// ════════════════════════════════════════════════════════════════════
//  공통 검색 로직 (구현체 간 동일 → 한 곳에 둔다)
// ════════════════════════════════════════════════════════════════════

/** 한/영 무시하고 부분일치 검사. */
function includesLoose(haystack: string | undefined | null, needle: string): boolean {
  if (!haystack) return false;
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

/** 카드 하나가 자유 텍스트 질의에 걸리는지. 카드명 + 룰 텍스트(한/영 모두) 대상. */
function matchesText(card: Card, q: string): boolean {
  const { en, ko } = card.localization;
  return (
    includesLoose(en.name, q) ||
    includesLoose(en.text, q) ||
    includesLoose(ko?.name, q) ||
    includesLoose(ko?.text, q) ||
    includesLoose(card.subtypes.join(" "), q)
  );
}

/**
 * 메모리 상의 카드 배열에 질의를 적용한다.
 * OpenSourceCardService(로컬 필터) / OfficialRiotCardService(API 필터 불가 시 폴백) 공용.
 */
export function applyCardQuery(cards: Card[], query: CardSearchQuery): Card[] {
  const q = query.q?.trim();

  let result = cards.filter((card) => {
    if (q && !matchesText(card, q)) return false;
    if (query.domain === "neutral") {
      if (card.domains.length > 0) return false;
    } else if (
      query.domain &&
      !card.domains.includes(query.domain) &&
      !(query.colorlessOk && card.domains.length === 0)
    ) {
      return false;
    }
    if (query.type && card.type !== query.type) return false;
    if (query.rarity && card.rarity !== query.rarity) return false;
    if (typeof query.cost === "number" && card.cost !== query.cost) return false;
    if (query.setCode && card.setCode.toLowerCase() !== query.setCode.toLowerCase()) return false;
    return true;
  });

  // 세트 → 수집번호 순 안정 정렬
  result.sort(
    (a, b) =>
      a.setCode.localeCompare(b.setCode, "en") ||
      (Number(a.collectorNumber) || 0) - (Number(b.collectorNumber) || 0) ||
      a.name.localeCompare(b.name, "en"),
  );

  const offset = Math.max(0, query.offset ?? 0);
  const end = typeof query.limit === "number" ? offset + Math.max(0, query.limit) : undefined;
  if (offset > 0 || end !== undefined) result = result.slice(offset, end);

  return result;
}

// ════════════════════════════════════════════════════════════════════
//  패싯(분포) 집계 — 필터 UI 의 그래프/개수 배지용
// ════════════════════════════════════════════════════════════════════

/** 코스트 히스토그램 상한(필터 칩과 동일: 0~7 정확히 일치). */
export const FACET_COST_MAX = 7;

export interface CardFacets {
  /** 현재 질의(모든 필터 적용)에 맞는 카드 수. */
  total: number;
  /** 각 차원은 "그 차원의 필터만 뺀" 결과 기준 개수 — 누르면 몇 장이 남는지. */
  domain: Record<string, number>;
  type: Record<string, number>;
  rarity: Record<string, number>;
  setCode: Record<string, number>;
  /** "0"~"7" (필터 칩과 동일하게 정확히 일치하는 카드 수). */
  cost: Record<string, number>;
}

/**
 * 필터 패널의 분포 그래프/개수용 집계.
 * 각 차원은 자기 필터를 제외한 질의 결과에서 센다(스마트 패싯).
 */
export async function getCardFacets(query: CardSearchQuery): Promise<CardFacets> {
  const all = await getCardService().getAllCards();
  const base: CardSearchQuery = { ...query, limit: undefined, offset: undefined };
  const poolWithout = (k: keyof CardSearchQuery) =>
    applyCardQuery(all, { ...base, [k]: undefined });

  const domainPool = poolWithout("domain");
  const domain: Record<string, number> = {};
  for (const d of CARD_DOMAIN_SLUGS) {
    domain[d] = domainPool.reduce((n, c) => n + (c.domains.includes(d) ? 1 : 0), 0);
  }
  domain.neutral = domainPool.reduce((n, c) => n + (c.domains.length === 0 ? 1 : 0), 0);

  const typePool = poolWithout("type");
  const type: Record<string, number> = {};
  for (const t of CARD_TYPE_SLUGS) {
    type[t] = typePool.reduce((n, c) => n + (c.type === t ? 1 : 0), 0);
  }

  const rarityPool = poolWithout("rarity");
  const rarity: Record<string, number> = {};
  for (const r of CARD_RARITY_SLUGS) {
    rarity[r] = rarityPool.reduce((n, c) => n + (c.rarity === r ? 1 : 0), 0);
  }

  const setPool = poolWithout("setCode");
  const setCode: Record<string, number> = {};
  for (const s of CARD_SET_CODES) {
    setCode[s] = setPool.reduce(
      (n, c) => n + (c.setCode.toUpperCase() === s ? 1 : 0),
      0,
    );
  }

  const costPool = poolWithout("cost");
  const cost: Record<string, number> = {};
  for (let i = 0; i <= FACET_COST_MAX; i++) cost[String(i)] = 0;
  for (const c of costPool) {
    if (c.cost != null && c.cost >= 0 && c.cost <= FACET_COST_MAX) cost[String(c.cost)] += 1;
  }

  return { total: applyCardQuery(all, base).length, domain, type, rarity, setCode, cost };
}

// ════════════════════════════════════════════════════════════════════
//  정규화 헬퍼 (원본 어휘 → 앱 슬러그)
// ════════════════════════════════════════════════════════════════════

function normalizeType(type: string | undefined, supertype: string | undefined): CardType {
  const s = (type ?? "").toLowerCase();
  // 레전드는 챔피언 태그가 붙어 있어도 레전드다 (레전드는 위력이 없음).
  if (s.includes("legend")) return "legend";
  if ((supertype ?? "").toLowerCase() === "champion") return "champion";
  return CARD_TYPE_SLUGS.find((slug) => s.includes(slug)) ?? "unit";
}

function normalizeSupertype(supertype: string | undefined): CardSupertype {
  const s = (supertype ?? "").toLowerCase();
  if (s === "champion") return "champion";
  if (s === "signature") return "signature";
  if (s === "token") return "token";
  return null;
}

function normalizeRarity(rarity: string | undefined): CardRarity {
  const s = (rarity ?? "").toLowerCase().trim();
  return CARD_RARITY_SLUGS.find((slug) => s === slug) ?? (s || "common");
}

/** "Fury" / "red" / "R" / "fury" 등 다양한 표기를 도메인 슬러그로. "Colorless" 는 매칭 안 됨(무색). */
const DOMAIN_LOOKUP: Map<string, CardDomain> = (() => {
  const m = new Map<string, CardDomain>();
  for (const d of CARD_DOMAINS) {
    m.set(d.slug, d.slug);
    m.set(d.en.toLowerCase(), d.slug);
    m.set(d.short.toLowerCase(), d.slug);
  }
  const colorAlias: Record<string, CardDomain> = {
    red: "fury",
    green: "calm",
    blue: "mind",
    orange: "body",
    purple: "chaos",
    yellow: "order",
  };
  for (const [k, v] of Object.entries(colorAlias)) m.set(k, v);
  return m;
})();

function normalizeDomains(domains: string[] | undefined): CardDomain[] {
  const out = new Set<CardDomain>();
  for (const c of domains ?? []) {
    const slug = DOMAIN_LOOKUP.get(String(c).toLowerCase());
    if (slug) out.add(slug);
  }
  return [...out];
}

// ════════════════════════════════════════════════════════════════════
//  OpenSourceCardService — playriftbound.com 공식 카드 갤러리 (현재 사용)
// ════════════════════════════════════════════════════════════════════
//
//  https://playriftbound.com/{locale}/card-gallery/  (Riot 공식 사이트, Next.js SSR)
//   - 인증 불필요. 별도 REST API 없이 페이지 HTML의 `__NEXT_DATA__` 에 전체 카드가 내려온다
//     (`prefetchAll:true`) — locale 당 GET 1회로 지원 세트(OGN·OGS) 전량 획득.
//   - **`ko-kr` 로케일이 실제로 한글 카드명·룰텍스트·카드 이미지를 준다** (OGN·OGS 만 공식 한글화됨).
//     `en-us` 로 canonical 영문을 같은 id 로 함께 받아 매칭한다.
//   - 이미지는 Riot 공식 CDN(cmsassets.rgpub.io) URL, 한글 로케일은 실제 한글 인쇄 이미지(고해상도).

export interface OpenSourceCardServiceConfig {
  /** 카드 갤러리 베이스 URL. 기본: `https://playriftbound.com`. */
  endpoint?: string;
  /** 엔드포인트 실패 시 읽을 로컬 JSON 스냅샷의 절대 경로. */
  localFallbackPath?: string;
  /** Next.js fetch 재검증 주기(초). 기본 24시간. */
  revalidateSeconds?: number;
}

/** 아이콘 등 `{id, label}` 형태 참조값. */
interface PbRef {
  id: string;
  label?: string;
}

/**
 * playriftbound.com `card-gallery` 블레이드의 카드 1건(`__NEXT_DATA__` 임베드).
 * 필드명이 바뀌거나 다른 소스로 갈아탈 때 수정 지점은 이 타입 + `mapPlayriftboundCard` 딱 두 곳.
 */
interface PbRawCard {
  id: string;
  collectorNumber?: number;
  name: string;
  subtitle?: string;
  set?: { value?: { id?: string } };
  cardType?: { type?: PbRef[]; superType?: PbRef[] };
  publicCode?: string;
  rarity?: { value?: { id?: string } };
  domain?: { values?: PbRef[] };
  cardImage?: { url?: string };
  orientation?: string;
  illustrator?: { values?: { label?: string }[] };
  text?: { richText?: { body?: string } };
  energy?: { value?: { id?: number } };
  might?: { value?: { id?: number } };
  tags?: { tags?: string[] };
}

interface PbGalleryData {
  cards: PbRawCard[];
  /** 세트 코드 → 정규 최대 수집번호. 이보다 큰 수집번호 = 오버넘버드. */
  setMax: Record<string, number>;
}

/** 로컬 폴백 스냅샷 형태 (locale 별 원본 그대로 저장). */
interface PbSnapshot {
  en: PbRawCard[];
  ko: PbRawCard[];
  setMax: Record<string, number>;
}

/**
 * playriftbound 갤러리 CMS 데이터 결번 보정.
 *
 * 야스오("Unforgiven")·징크스("Loose Cannon") 두 인쇄판은 사이트 원본에서 챔피언 본명이
 * 빠진 채 부제만 `name` 에 들어온다(en/ko 로케일 공통 버그, id 로 확인됨).
 * 여기서 본명+부제를 되살린다 — 두 챔피언은 어차피 [[PRESERVE_RIFTNARU_KO]] 대상이라
 * 한글 표시엔 영향 없지만, 영문 표시·번역 키 매칭(`baseNameKey`)에는 필요하다.
 */
const NAME_FIXUPS: Record<string, { en: { name: string; subtitle: string }; ko: { name: string; subtitle: string } }> = {
  "ogn-251-298": { en: { name: "Jinx", subtitle: "Loose Cannon" }, ko: { name: "징크스", subtitle: "난폭한 말괄량이" } },
  "ogn-301-298": { en: { name: "Jinx", subtitle: "Loose Cannon" }, ko: { name: "징크스", subtitle: "난폭한 말괄량이" } },
  "ogn-301-star-298": { en: { name: "Jinx", subtitle: "Loose Cannon" }, ko: { name: "징크스", subtitle: "난폭한 말괄량이" } },
  "ogn-259-298": { en: { name: "Yasuo", subtitle: "Unforgiven" }, ko: { name: "야스오", subtitle: "용서받지 못한 자" } },
  "ogn-305-298": { en: { name: "Yasuo", subtitle: "Unforgiven" }, ko: { name: "야스오", subtitle: "용서받지 못한 자" } },
  "ogn-305-star-298": { en: { name: "Yasuo", subtitle: "Unforgiven" }, ko: { name: "야스오", subtitle: "용서받지 못한 자" } },
};

/**
 * 야스오·징크스는 playriftbound 공식 한글 대신 기존 리프트나루 번역(`cards-ko.json`)을
 * 그대로 유지한다 (사용자 지정 — 이미 검증된 원래 한글판을 바꾸지 않음). 키는 `baseNameKey`.
 */
const PRESERVE_RIFTNARU_KO = new Set([
  "yasuo - remorseful",
  "yasuo - windrider",
  "yasuo - unforgiven",
  "jinx - demolitionist",
  "jinx - rebel",
  "jinx - loose cannon",
]);

const PB_NEXT_DATA_RE = /<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/;
/** 한글 포함 여부 — 아직 번역 안 된 세트는 ko-kr 로케일도 영문 그대로라 이걸로 걸러낸다. */
const HANGUL_RE = /[가-힣]/;

/** richText(HTML) → 심볼 코드(`:rb_*:`)는 보존한 평문. */
function stripHtml(html: string | undefined | null): string {
  if (!html) return "";
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>\s*<p[^>]*>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

/** 카드 1건의 `__NEXT_DATA__` 페이지에서 `card-gallery` 블레이드를 뽑아 카드+세트 정보를 반환. */
function parsePbGalleryHtml(html: string, supportedSets: Set<string>): PbGalleryData {
  const match = PB_NEXT_DATA_RE.exec(html);
  if (!match) throw new CardServiceError("카드 갤러리 __NEXT_DATA__ 를 찾지 못함");

  let data: unknown;
  try {
    data = JSON.parse(match[1]);
  } catch (err) {
    throw new CardServiceError("카드 갤러리 __NEXT_DATA__ JSON 파싱 실패", err);
  }

  const blades = (data as { props?: { pageProps?: { page?: { blades?: unknown[] } } } })?.props?.pageProps?.page
    ?.blades;
  const gallery = Array.isArray(blades)
    ? (blades.find((b) => (b as { fragmentId?: string }).fragmentId === "card-gallery") as
        | {
            cards?: { items?: PbRawCard[] };
            sets?: { items?: { id?: string; collectorNumberMax?: number }[] };
          }
        | undefined)
    : undefined;

  const cards = (gallery?.cards?.items ?? []).filter((c) =>
    supportedSets.has(String(c.set?.value?.id ?? "").toUpperCase()),
  );
  const setMax: Record<string, number> = {};
  for (const s of gallery?.sets?.items ?? []) {
    if (s.id) setMax[String(s.id).toUpperCase()] = Number(s.collectorNumberMax) || 0;
  }
  return { cards, setMax };
}

async function fetchPbGallery(
  base: string,
  locale: "ko-kr" | "en-us",
  revalidateSeconds: number,
): Promise<PbGalleryData> {
  const url = `${base}/${locale}/card-gallery/`;
  let res: Response;
  try {
    res = await fetch(url, {
      next: { revalidate: revalidateSeconds, tags: ["cards"] },
      signal: AbortSignal.timeout(15_000),
    });
  } catch (err) {
    throw new CardServiceError(`카드 갤러리 네트워크 오류: ${url}`, err);
  }
  if (!res.ok) throw new CardServiceError(`카드 갤러리 ${res.status} ${res.statusText}: ${url}`);

  const html = await res.text();
  return parsePbGalleryHtml(html, SUPPORTED_SETS);
}

// ── 한글 번역 오버라이드 (리프트나루 스냅샷 — 야스오·징크스 전용) ──────
//
//  data/cards-ko.json = 영문 카드명(소문자) → { n: 한글명, t: 한글 룰텍스트 }.
//  `npm run sync:cards-ko` 로 갱신. [[PRESERVE_RIFTNARU_KO]] 대상 카드에만 쓰인다.

interface KoEntry {
  n: string;
  t?: string;
}

let koCache: Promise<Map<string, KoEntry>> | null = null;

/** 이형(Alternate Art / Signature / Overnumbered …) 접미사를 뗀 소문자 이름 = 번역 키. */
function baseNameKey(name: string): string {
  return name
    .replace(/\s*\([^)]*\)\s*$/, "")
    .trim()
    .toLowerCase();
}

function loadKoTranslations(): Promise<Map<string, KoEntry>> {
  if (!koCache) {
    koCache = (async () => {
      try {
        const p = path.join(process.cwd(), "data", "cards-ko.json");
        const raw = JSON.parse(await readFile(p, "utf8")) as { map?: Record<string, KoEntry> };
        return new Map(Object.entries(raw.map ?? {}));
      } catch (err) {
        console.warn("[cardService] 한글 번역(cards-ko.json) 로드 실패 — 영문으로 진행:", err);
        return new Map<string, KoEntry>();
      }
    })();
  }
  return koCache;
}

/** 룰 텍스트의 심볼 코드(:rb_xxx:)를 읽기 쉬운 형태로. 로케일별 어휘. */
const RUNE_WORDS: Record<"ko" | "en", Record<string, string>> = {
  ko: { fury: "분노", calm: "침착", mind: "지혜", body: "육체", chaos: "혼돈", order: "질서", rainbow: "무지개" },
  en: { fury: "Fury", calm: "Calm", mind: "Mind", body: "Body", chaos: "Chaos", order: "Order", rainbow: "Any" },
};
const SYMBOL_WORDS: Record<"ko" | "en", Record<string, string>> = {
  ko: { rb_exhaust: "[휴식]", rb_might: "위력", rb_power: "파워", rb_recycle: "[재활용]" },
  en: { rb_exhaust: "[Exhaust]", rb_might: "Might", rb_power: "Power", rb_recycle: "[Recycle]" },
};
function humanizeSymbols(text: string, locale: "ko" | "en" = "ko"): string {
  const runes = RUNE_WORDS[locale];
  const words = SYMBOL_WORDS[locale];
  const runeLabel = locale === "ko" ? (c: string) => `[${c} 룬]` : (c: string) => `[${c} Rune]`;
  return text
    .replace(/:rb_energy_(\d+):/g, "($1)") // 에너지 비용
    .replace(/:rb_rune_(\w+):/g, (_m, c: string) => runeLabel(runes[c] ?? c))
    .replace(/:(rb_\w+):/g, (_m, code: string) => words[code] ?? `[${code.replace(/^rb_/, "")}]`);
}

function cleanText(plain: string | undefined | null, locale: "ko" | "en" = "en"): string {
  const t = (plain ?? "").trim();
  if (t === "") return "";
  return humanizeSymbols(t, locale);
}

function fullNameOf(name: string, subtitle: string | undefined): string {
  return subtitle ? `${name} - ${subtitle}` : name;
}

/** 이 인쇄판이 어떤 트리트먼트인지 (playriftbound 는 명시 플래그가 없어 규칙으로 판정). */
function treatmentOfPb(raw: PbRawCard, setMax: number | undefined): CardPrinting["treatment"] {
  const superIds = (raw.cardType?.superType ?? []).map((t) => t.id);
  if (superIds.includes("signature")) return "signature";

  const num = raw.collectorNumber ?? null;
  if (setMax != null && num != null && num > setMax) return "overnumbered";

  const suffix = /^[A-Z]+-\d+([a-z]|\*)\//.exec(raw.publicCode ?? "")?.[1];
  if (suffix) return "alt_art";

  if ((raw.rarity?.value?.id ?? "") === "showcase") return "showcase";
  return "base";
}

function toPrintingPb(raw: PbRawCard, treatment: CardPrinting["treatment"]): CardPrinting {
  return {
    id: raw.id,
    treatment,
    rarity: raw.rarity?.value?.id || "common",
    collectorNumber: raw.collectorNumber != null ? String(raw.collectorNumber) : null,
    imageUrl: raw.cardImage?.url ?? null,
    isBase: treatment === "base",
  };
}

/**
 * playriftbound 카드(인쇄판 1건, en/ko 로케일 쌍) → 앱 도메인 모델.
 * 이 단계에서는 인쇄판 하나만 담긴다. `groupCards()` 가 같은 카드의 인쇄판들을 묶는다.
 *
 * ─ 이미지 정책 ─
 *   `localization.ko.imageUrl` 은 **실제 한글 인쇄 카드 이미지**(playriftbound ko-kr, 고해상도).
 *   대표 `imageUrl`/`localization.en.imageUrl` 은 영문 이미지. `<LocalizedCard>` 는 한글 이미지가
 *   있으면 그걸 그대로 보여주고, 없을 때만 영문 이미지 위에 텍스트를 얹는 기존 오버레이로 폴백한다.
 */
function mapPlayriftboundCard(
  enRaw: PbRawCard,
  koRaw: PbRawCard | undefined,
  setMax: number | undefined,
  ko: Map<string, KoEntry>,
): Card {
  const fixEn = NAME_FIXUPS[enRaw.id]?.en;
  const nameEn = fixEn?.name ?? enRaw.name?.trim() ?? enRaw.id;
  const subtitleEn = fixEn?.subtitle ?? enRaw.subtitle;
  const fullEn = fullNameOf(nameEn, subtitleEn);
  const key = baseNameKey(fullEn);

  const textEn = cleanText(stripHtml(enRaw.text?.richText?.body), "en");
  const imageEn = enRaw.cardImage?.url ?? null;
  const imageKo = koRaw?.cardImage?.url ?? imageEn;
  const en = { name: fullEn, text: textEn, imageUrl: imageEn };

  let koLoc: CardLocalizedText | undefined;
  if (PRESERVE_RIFTNARU_KO.has(key)) {
    const entry = ko.get(key);
    if (entry) koLoc = { name: entry.n, text: entry.t ? humanizeSymbols(entry.t) : textEn, imageUrl: imageKo };
  } else if (koRaw) {
    const fixKo = NAME_FIXUPS[koRaw.id]?.ko;
    const nameKo = fixKo?.name ?? koRaw.name?.trim();
    const subtitleKo = fixKo?.subtitle ?? koRaw.subtitle;
    const fullKo = nameKo ? fullNameOf(nameKo, subtitleKo) : undefined;
    const textKo = cleanText(stripHtml(koRaw.text?.richText?.body), "ko");
    // 아직 공식 한글화가 안 된 세트는 ko-kr 로케일도 이름·텍스트가 영문 그대로 내려온다
    // (UI 라벨만 한글). 그런 경우 ko 를 채우지 않아야 en 으로 자연히 폴백된다.
    if (fullKo && HANGUL_RE.test(fullKo)) koLoc = { name: fullKo, text: textKo || textEn, imageUrl: imageKo };
  }

  const typeIds = enRaw.cardType?.type ?? [];
  const superIds = enRaw.cardType?.superType ?? [];
  const treatment = treatmentOfPb(enRaw, setMax);

  return {
    id: enRaw.id,
    setCode: String(enRaw.set?.value?.id ?? "UNKNOWN").toUpperCase(),
    collectorNumber: enRaw.collectorNumber != null ? String(enRaw.collectorNumber) : null,
    name: koLoc?.name ?? en.name,
    text: koLoc?.text ?? en.text,
    cost: enRaw.energy?.value?.id ?? null,
    power: enRaw.might?.value?.id ?? null,
    toughness: null,
    type: normalizeType(typeIds[0]?.id, superIds[0]?.id),
    supertype: normalizeSupertype(superIds[0]?.id),
    orientation: enRaw.orientation === "landscape" ? "landscape" : "portrait",
    subtypes: isBanned(enRaw.id) ? [BAN_TAG, ...(enRaw.tags?.tags ?? [])] : (enRaw.tags?.tags ?? []),
    domains: normalizeDomains((enRaw.domain?.values ?? []).map((d) => d.id)),
    rarity: normalizeRarity(enRaw.rarity?.value?.id),
    imageUrl: imageEn,
    artist: enRaw.illustrator?.values?.[0]?.label ?? null,
    localization: { en, ...(koLoc ? { ko: koLoc } : {}) },
    source: "opensource",
    printings: [toPrintingPb(enRaw, treatment)],
  };
}

const TREATMENT_ORDER: Record<CardPrinting["treatment"], number> = {
  base: 0,
  alt_art: 1,
  showcase: 2,
  signature: 3,
  overnumbered: 4,
  promo: 5,
};

/**
 * 같은 카드의 여러 인쇄판(기본 + 얼터아트/시그니처/오버넘버드/프로모)을 하나로 묶는다.
 * 대표(기본) 카드를 반환하고, 모든 인쇄판을 `printings` 에 담는다.
 */
function groupCards(cards: Card[]): Card[] {
  const groups = new Map<string, Card[]>();
  for (const c of cards) {
    const key = `${c.setCode}::${baseNameKey(c.localization.en.name)}`;
    const arr = groups.get(key);
    if (arr) arr.push(c);
    else groups.set(key, [c]);
  }

  const out: Card[] = [];
  for (const members of groups.values()) {
    const printings = members
      .flatMap((m) => m.printings)
      .sort(
        (a, b) =>
          TREATMENT_ORDER[a.treatment] - TREATMENT_ORDER[b.treatment] ||
          (Number(a.collectorNumber) || 0) - (Number(b.collectorNumber) || 0),
      );

    // 대표 = 기본 인쇄판을 가진 멤버, 없으면 첫 멤버
    const base =
      members.find((m) => m.printings.some((p) => p.isBase)) ??
      members.sort((a, b) => (Number(a.collectorNumber) || 0) - (Number(b.collectorNumber) || 0))[0];

    // 진짜 "base" 트리트먼트가 없는 카드(시그니처 단독 인쇄 등) — 대표로 고른 인쇄판을 표시용 기본으로 취급
    if (!printings.some((p) => p.isBase)) {
      const rep = printings.find((p) => p.id === base.printings[0]?.id);
      if (rep) rep.isBase = true;
    }

    out.push({ ...base, printings });
  }
  return out;
}

export class OpenSourceCardService implements ICardService {
  private readonly config: Required<Pick<OpenSourceCardServiceConfig, "revalidateSeconds">> &
    OpenSourceCardServiceConfig;

  /** getAllCards 결과 메모이즈 (요청마다 fetch/파일읽기 반복 방지). */
  private cache: Promise<Card[]> | null = null;

  constructor(config: OpenSourceCardServiceConfig = {}) {
    this.config = {
      revalidateSeconds: DEFAULT_REVALIDATE,
      ...config,
    };
  }

  async getAllCards(): Promise<Card[]> {
    if (!this.cache) {
      this.cache = this.load().catch((err) => {
        this.cache = null; // 실패는 캐시하지 않음 → 다음 요청에서 재시도
        throw err;
      });
    }
    return this.cache;
  }

  async getCardById(id: string): Promise<Card | null> {
    const all = await this.getAllCards();
    // 대표 id 또는 변형 인쇄판 id 로도 찾을 수 있게
    return (
      all.find((c) => c.id === id) ??
      all.find((c) => c.printings.some((p) => p.id === id)) ??
      null
    );
  }

  async searchCards(query: CardSearchQuery): Promise<Card[]> {
    const all = await this.getAllCards();
    return applyCardQuery(all, query);
  }

  // ── 내부: 원격 → (실패 시) 로컬 순으로 로드 ──────────────────

  private async load(): Promise<Card[]> {
    const errors: unknown[] = [];

    if (this.config.endpoint) {
      try {
        const cards = await this.fetchAllRemote(this.config.endpoint);
        if (cards.length > 0) return cards;
        errors.push(new Error("원격 응답에 카드가 없음"));
      } catch (err) {
        errors.push(err);
        console.warn("[cardService] playriftbound 로드 실패, 로컬 스냅샷으로 폴백:", err);
      }
    }

    if (this.config.localFallbackPath) {
      try {
        return await this.readLocal(this.config.localFallbackPath);
      } catch (err) {
        errors.push(err);
      }
    }

    throw new CardServiceError(
      "카드 데이터를 어느 소스에서도 불러오지 못했습니다 (endpoint/localFallbackPath 확인).",
      errors,
    );
  }

  /** en-us + ko-kr 갤러리를 각 1회 받아 id 로 합친다 (playriftbound 는 SSR 로 전 카드가 한 페이지에 옴). */
  private async fetchAllRemote(base: string): Promise<Card[]> {
    const ko = await loadKoTranslations();
    const [en, koGallery] = await Promise.all([
      fetchPbGallery(base, "en-us", this.config.revalidateSeconds),
      fetchPbGallery(base, "ko-kr", this.config.revalidateSeconds),
    ]);

    const koById = new Map(koGallery.cards.map((c) => [c.id, c]));
    const mapped = en.cards.map((raw) =>
      mapPlayriftboundCard(raw, koById.get(raw.id), en.setMax[String(raw.set?.value?.id ?? "").toUpperCase()], ko),
    );

    return groupCards(mapped.filter((c) => SUPPORTED_SETS.has(c.setCode)));
  }

  private async readLocal(filePath: string): Promise<Card[]> {
    let text: string;
    try {
      text = await readFile(filePath, "utf8");
    } catch (err) {
      throw new CardServiceError(`로컬 카드 스냅샷 읽기 실패: ${filePath}`, err);
    }

    try {
      const snapshot = JSON.parse(text) as Partial<PbSnapshot>;
      const ko = await loadKoTranslations();
      const koById = new Map((snapshot.ko ?? []).map((c) => [c.id, c]));
      const setMax = snapshot.setMax ?? {};
      const mapped = (snapshot.en ?? []).map((raw) =>
        mapPlayriftboundCard(raw, koById.get(raw.id), setMax[String(raw.set?.value?.id ?? "").toUpperCase()], ko),
      );
      return groupCards(mapped.filter((c) => SUPPORTED_SETS.has(c.setCode)));
    } catch (err) {
      throw new CardServiceError(`로컬 카드 스냅샷 파싱 실패: ${filePath}`, err);
    }
  }
}

// ════════════════════════════════════════════════════════════════════
//  OfficialRiotCardService — 스텁 (Riot Production API 승인 후 구현)
// ════════════════════════════════════════════════════════════════════

export interface OfficialRiotCardServiceConfig {
  /** Riot API 키 (서버 전용, RIOT_API_KEY). */
  apiKey?: string;
  /** 콘텐츠 엔드포인트 베이스. 기본값은 아시아 라우팅. */
  baseUrl?: string;
  /** 응답 로케일. 공식 한글 데이터가 열리면 "ko_KR". */
  locale?: string;
  revalidateSeconds?: number;
}

/**
 * 라이엇 공식 Riftbound Content API 어댑터 (스텁).
 *
 * 승인 후 할 일:
 *  1. `getContents()` 에서 `GET {baseUrl}/riftbound/content/v1/contents?locale={locale}` 호출
 *     (헤더 `X-Riot-Token: {apiKey}`)
 *  2. 응답의 카드 엔트리를 `mapRiotCard()` 로 `Card` 에 매핑 (source: "official-riot").
 *     로케일이 ko_KR 이면 localization.ko 도 채운다.
 *  3. `NEXT_PUBLIC_DATA_SOURCE=official-riot` 로 스위치 — 상위 코드 수정 불필요
 *
 * 그 전까지 모든 메서드는 명시적으로 실패한다(조용한 빈 결과보다 낫다).
 */
export class OfficialRiotCardService implements ICardService {
  constructor(private readonly config: OfficialRiotCardServiceConfig = {}) {}

  private notImplemented(): never {
    throw new CardServiceError(
      "OfficialRiotCardService 는 아직 미구현입니다. Riot Production API 승인 후 활성화하세요 " +
        "(NEXT_PUBLIC_DATA_SOURCE=opensource 로 되돌리면 정상 동작).",
    );
  }

  async getAllCards(): Promise<Card[]> {
    // return (await this.getContents()).map(mapRiotCard);
    return this.notImplemented();
  }

  async getCardById(_id: string): Promise<Card | null> {
    return this.notImplemented();
  }

  async searchCards(_query: CardSearchQuery): Promise<Card[]> {
    // 공식 API 가 서버측 필터를 안 주면: applyCardQuery(await this.getAllCards(), _query)
    return this.notImplemented();
  }

  /*
  private async getContents(): Promise<unknown[]> {
    const base = this.config.baseUrl ?? "https://asia.api.riotgames.com";
    const locale = this.config.locale ?? "en_US";
    if (!this.config.apiKey) throw new CardServiceError("RIOT_API_KEY 누락");

    const res = await fetch(`${base}/riftbound/content/v1/contents?locale=${locale}`, {
      headers: { "X-Riot-Token": this.config.apiKey },
      next: { revalidate: this.config.revalidateSeconds ?? DEFAULT_REVALIDATE, tags: ["cards"] },
    });
    if (!res.ok) throw new CardServiceError(`Riot API ${res.status}`);
    const json = await res.json();
    return json.cards ?? [];
  }
  */
}

// ════════════════════════════════════════════════════════════════════
//  팩토리 — 환경변수로 구현체 선택
// ════════════════════════════════════════════════════════════════════

let singleton: { source: CardDataSource; service: ICardService } | null = null;

/** NEXT_PUBLIC_DATA_SOURCE 값을 안전하게 파싱 (기본: opensource). */
export function resolveDataSource(): CardDataSource {
  const raw = process.env.NEXT_PUBLIC_DATA_SOURCE?.trim();
  return raw === "official-riot" ? "official-riot" : "opensource";
}

/** 지정한 소스의 서비스 인스턴스를 새로 만든다(테스트/특수 목적). */
export function createCardService(source: CardDataSource = resolveDataSource()): ICardService {
  switch (source) {
    case "official-riot":
      return new OfficialRiotCardService({
        apiKey: process.env.RIOT_API_KEY,
        locale: process.env.RIOT_CONTENT_LOCALE,
      });
    case "opensource":
    default:
      return new OpenSourceCardService({
        endpoint: process.env.OPENSOURCE_CARDS_ENDPOINT ?? "https://playriftbound.com",
        localFallbackPath: path.join(process.cwd(), "data", "cards.json"),
      });
  }
}

/**
 * 앱 전역에서 쓰는 카드 서비스.
 * 소스가 그대로면 인스턴스를 재사용해 in-memory 캐시를 살린다.
 */
export function getCardService(): ICardService {
  const source = resolveDataSource();
  if (!singleton || singleton.source !== source) {
    singleton = { source, service: createCardService(source) };
  }
  return singleton.service;
}
