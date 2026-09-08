import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

import {
  type Card,
  type CardDataSource,
  type CardDomain,
  type CardPrinting,
  type CardRarity,
  type CardSearchQuery,
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
 * ├─ OpenSourceCardService ... 현재 사용. Riftcodex 공개 REST API + 로컬 JSON 스냅샷 폴백
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
    if (query.domain && !card.domains.includes(query.domain)) return false;
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
//  OpenSourceCardService — Riftcodex 공개 API (현재 사용)
// ════════════════════════════════════════════════════════════════════
//
//  Riftcodex: https://riftcodex.com  (커뮤니티 DB, Riot "Legal Jibber Jabber" 준수)
//   - 인증 불필요
//   - GET /cards?page=<n>&size=<=100  →  { items: RiftcodexCard[], total, page, size, pages }
//   - 이미지는 Riot 공식 CDN(cmsassets.rgpub.io) URL 제공
//   - 한국어 번역은 없음(en 만). 공식 한글 나오면 OfficialRiotCardService 로.

export interface OpenSourceCardServiceConfig {
  /** 카드 목록 엔드포인트. 기본: Riftcodex `/cards`. */
  endpoint?: string;
  /** 엔드포인트 실패 시 읽을 로컬 JSON 스냅샷의 절대 경로. */
  localFallbackPath?: string;
  /** Next.js fetch 재검증 주기(초). 기본 24시간. */
  revalidateSeconds?: number;
  /** 페이지 크기(Riftcodex 최대 100). */
  pageSize?: number;
  /** 무한 루프 방지용 상한. */
  maxPages?: number;
  /** 엔드포인트가 키를 요구하면(현재 Riftcodex 는 불필요). */
  apiKey?: string;
}

/**
 * Riftcodex `/cards` 응답의 카드 1건.
 * 필드명이 바뀌거나 다른 오픈소스로 갈아탈 때 수정 지점은 이 타입 + `mapRiftcodexCard` 딱 두 곳.
 */
interface RiftcodexCard {
  id: string;
  name: string;
  riftbound_id?: string;
  tcgplayer_id?: string | null;
  collector_number?: number;
  attributes?: { energy?: number | null; might?: number | null; power?: number | null };
  classification?: {
    type?: string;
    supertype?: string | null;
    rarity?: string;
    domain?: string[];
  };
  text?: { rich?: string; plain?: string; flavour?: string | null };
  set?: { set_id?: string; label?: string };
  media?: { image_url?: string; artist?: string; accessibility_text?: string };
  tags?: string[];
  orientation?: string;
  metadata?: {
    clean_name?: string | null;
    overnumbered?: boolean;
    signature?: boolean;
    alternate_art?: boolean;
  };
}

interface RiftcodexPage {
  items: RiftcodexCard[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

type LocalSnapshot = RiftcodexPage | { items: RiftcodexCard[] } | RiftcodexCard[];

// ── 한글 번역 (리프트나루 스냅샷) ────────────────────────────────
//
//  data/cards-ko.json = 영문 카드명(소문자) → { n: 한글명, t: 한글 룰텍스트, img: 한글 카드이미지 }.
//  `npm run sync:cards-ko` 로 갱신. 번역이 없는 카드는 맵에 없음 → 영문 그대로 표시.

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

/** Riftcodex 는 룰 텍스트가 없을 때 "[NO TEXT]" 를 준다. */
function cleanText(plain: string | undefined | null, locale: "ko" | "en" = "en"): string {
  const t = (plain ?? "").trim();
  if (t === "" || t === "[NO TEXT]") return "";
  return humanizeSymbols(t, locale);
}

/** 이 인쇄판이 어떤 트리트먼트인지. */
function treatmentOf(raw: RiftcodexCard): CardPrinting["treatment"] {
  const m = raw.metadata ?? {};
  const rar = (raw.classification?.rarity ?? "").toLowerCase();
  if (m.signature) return "signature";
  if (m.overnumbered) return "overnumbered";
  if (rar === "promo") return "promo";
  if (m.alternate_art) return "alt_art";
  if (rar === "showcase") return "showcase";
  return "base";
}

function toPrinting(raw: RiftcodexCard): CardPrinting {
  const t = treatmentOf(raw);
  return {
    id: raw.id,
    treatment: t,
    rarity: (raw.classification?.rarity ?? "").toLowerCase() || "common",
    collectorNumber: raw.collector_number != null ? String(raw.collector_number) : null,
    imageUrl: raw.media?.image_url ?? null,
    isBase: t === "base",
  };
}

/**
 * Riftcodex 카드(인쇄판 1건) → 앱 도메인 모델.
 * 이 단계에서는 인쇄판 하나만 담긴다. `groupCards()` 가 같은 카드의 인쇄판들을 묶는다.
 *
 * ─ 이미지 정책 ─
 *   imageUrl 은 **항상 Riftcodex 의 고화질 공식(rgpub) 이미지**. 한글 카드는 `<LocalizedCard>` 가
 *   이 영문 이미지 위에 한글 이름·룰텍스트를 얹어 렌더한다.
 */
function mapRiftcodexCard(raw: RiftcodexCard, ko?: Map<string, KoEntry>): Card {
  const nameEn = raw.name?.trim() || raw.id;
  const textEn = cleanText(raw.text?.plain);
  const flavour = raw.text?.flavour?.trim();
  const imageEn = raw.media?.image_url ?? null;

  const en = {
    name: nameEn,
    text: textEn,
    imageUrl: imageEn,
    ...(flavour ? { flavor: flavour } : {}),
  };

  const koEntry = ko?.get(baseNameKey(nameEn));
  const koLoc = koEntry
    ? {
        name: koEntry.n,
        text: koEntry.t ? humanizeSymbols(koEntry.t) : textEn,
        ...(flavour ? { flavor: flavour } : {}),
      }
    : undefined;

  return {
    id: raw.id,
    setCode: raw.set?.set_id?.toUpperCase() || "UNKNOWN",
    collectorNumber: raw.collector_number != null ? String(raw.collector_number) : null,
    name: koLoc?.name ?? en.name,
    text: koLoc?.text ?? en.text,
    cost: raw.attributes?.energy ?? null,
    power: raw.attributes?.might ?? null,
    toughness: null,
    type: normalizeType(raw.classification?.type, raw.classification?.supertype ?? undefined),
    orientation: raw.orientation === "landscape" ? "landscape" : "portrait",
    subtypes: isBanned(raw.id) ? [BAN_TAG, ...(raw.tags ?? [])] : (raw.tags ?? []),
    domains: normalizeDomains(raw.classification?.domain),
    rarity: normalizeRarity(raw.classification?.rarity),
    imageUrl: imageEn,
    artist: raw.media?.artist ?? null,
    localization: { en, ...(koLoc ? { ko: koLoc } : {}) },
    source: "opensource",
    printings: [toPrinting(raw)],
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

    out.push({ ...base, printings });
  }
  return out;
}

function itemsOf(snapshot: LocalSnapshot): RiftcodexCard[] {
  if (Array.isArray(snapshot)) return snapshot;
  return snapshot.items ?? [];
}

export class OpenSourceCardService implements ICardService {
  private readonly config: Required<
    Pick<OpenSourceCardServiceConfig, "revalidateSeconds" | "pageSize" | "maxPages">
  > &
    OpenSourceCardServiceConfig;

  /** getAllCards 결과 메모이즈 (요청마다 fetch/파일읽기 반복 방지). */
  private cache: Promise<Card[]> | null = null;

  constructor(config: OpenSourceCardServiceConfig = {}) {
    this.config = {
      revalidateSeconds: DEFAULT_REVALIDATE,
      pageSize: 100,
      maxPages: 100,
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
        console.warn("[cardService] Riftcodex 로드 실패, 로컬 스냅샷으로 폴백:", err);
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

  /** 지원 세트별로 페이지를 순회해 카드를 모은다 (constants.CARD_SETS 만). */
  private async fetchAllRemote(endpoint: string): Promise<Card[]> {
    const out: Card[] = [];
    const ko = await loadKoTranslations();

    for (const setCode of CARD_SET_CODES) {
      let page = 1;
      let totalPages = 1;
      do {
        const url = new URL(endpoint);
        url.searchParams.set("set_id", setCode.toLowerCase());
        url.searchParams.set("page", String(page));
        url.searchParams.set("size", String(this.config.pageSize));

        const body = await this.fetchPage(url);
        out.push(...body.items.map((c) => mapRiftcodexCard(c, ko)));

        totalPages = Number.isFinite(body.pages) && body.pages > 0 ? body.pages : page;
        page += 1;
      } while (page <= totalPages && page <= this.config.maxPages);
    }

    // set_id 필터를 못 거는 소스 대비 안전망 + 인쇄판 그룹핑
    return groupCards(out.filter((c) => SUPPORTED_SETS.has(c.setCode)));
  }

  private async fetchPage(url: URL): Promise<RiftcodexPage> {
    let res: Response;
    try {
      res = await fetch(url, {
        headers: this.config.apiKey ? { Authorization: `Bearer ${this.config.apiKey}` } : {},
        // ISR: 요청마다 때리지 않고 하루 단위 재검증. `cards` 태그로 on-demand 무효화 가능.
        next: { revalidate: this.config.revalidateSeconds, tags: ["cards"] },
      });
    } catch (err) {
      throw new CardServiceError(`카드 API 네트워크 오류: ${url.href}`, err);
    }

    if (!res.ok) {
      throw new CardServiceError(`카드 API ${res.status} ${res.statusText}: ${url.href}`);
    }

    try {
      const json = (await res.json()) as Partial<RiftcodexPage>;
      return {
        items: json.items ?? [],
        total: json.total ?? 0,
        page: json.page ?? 1,
        size: json.size ?? this.config.pageSize,
        pages: json.pages ?? 1,
      };
    } catch (err) {
      throw new CardServiceError("카드 API 응답 JSON 파싱 실패", err);
    }
  }

  private async readLocal(filePath: string): Promise<Card[]> {
    let text: string;
    try {
      text = await readFile(filePath, "utf8");
    } catch (err) {
      throw new CardServiceError(`로컬 카드 스냅샷 읽기 실패: ${filePath}`, err);
    }

    try {
      const snapshot = JSON.parse(text) as LocalSnapshot;
      const ko = await loadKoTranslations();
      const mapped = itemsOf(snapshot)
        .map((c) => mapRiftcodexCard(c, ko))
        .filter((c) => SUPPORTED_SETS.has(c.setCode));
      return groupCards(mapped);
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
        endpoint: process.env.OPENSOURCE_CARDS_ENDPOINT ?? "https://api.riftcodex.com/cards",
        localFallbackPath: path.join(process.cwd(), "data", "cards.json"),
        apiKey: process.env.OPENSOURCE_CARDS_API_KEY,
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
