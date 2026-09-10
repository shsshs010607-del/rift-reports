/**
 * JustTCG API 클라이언트 (시세). 실제 응답(2026-09 확인) 기준.
 *
 * base: https://api.justtcg.com/v1   auth: x-api-key
 * 리프트바운드 game id: "riftbound-league-of-legends-trading-card-game"
 * free tier: 1000/월, 100/일, rate 10
 *
 * /cards?game=<id>&limit=200&offset=<n>  →  카드 목록 + 각 변형의 현재 시세·통계·7~30일 히스토리.
 * 별도 배치/가격 엔드포인트 불필요 (목록에 시세 포함). 이미지·언어별 카드·매수/매도 호가는 제공 안 함.
 */

const BASE = "https://api.justtcg.com/v1";

export interface JustTcgConfig {
  apiKey: string;
  game: string;
  sets: readonly string[]; // 빈 배열이면 전체
  pageLimit: number; // 무료 20
}

interface RawVariant {
  id: string;
  condition: string; // "Near Mint"
  printing: string; // "Normal" | "Foil"
  language: string; // "English"
  tcgplayerSkuId?: string;
  price?: number | null;
  lastUpdated?: number;
  priceChange24hr?: number | null;
  priceChange7d?: number | null;
  priceChange30d?: number | null;
  priceChange90d?: number | null;
  avgPrice30d?: number | null;
  minPrice90d?: number | null;
  maxPrice90d?: number | null;
  priceHistory?: { p: number; t: number }[] | null;
}
export interface RawCard {
  id: string;
  uuid: string;
  name: string;
  set?: string;
  set_name?: string;
  number?: string;
  rarity?: string;
  tcgplayerId?: string | null;
  variants?: RawVariant[];
}
interface ListResponse {
  data: RawCard[];
  meta?: { total?: number; limit?: number; offset?: number; hasMore?: boolean };
  _metadata?: { apiRequestsRemaining?: number; apiDailyRequestsRemaining?: number };
}

const CONDITION_MAP: Record<string, string> = {
  "near mint": "NM",
  "lightly played": "LP",
  "moderately played": "MP",
  "heavily played": "HP",
  damaged: "DM",
};
const LANG_MAP: Record<string, string> = {
  english: "en",
  japanese: "ja",
  "chinese (simplified)": "zh",
  "chinese (traditional)": "zh",
  korean: "ko",
};

const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);
const normCondition = (c: string) => CONDITION_MAP[c?.toLowerCase()] ?? "NM";
const normPrinting = (p: string) => (p?.toLowerCase().includes("foil") ? "foil" : "normal");
const normLang = (l: string) => LANG_MAP[l?.toLowerCase()] ?? "en";

/** TCGplayer 상품 딥링크 ("거래 사이트로 이동") */
export const tcgplayerUrl = (id?: string | null) =>
  id ? `https://www.tcgplayer.com/product/${id}` : null;
/** TCGplayer 상품 이미지 CDN (JustTCG 는 이미지 미제공) */
export const tcgplayerImage = (id?: string | null) =>
  id ? `https://tcgplayer-cdn.tcgplayer.com/product/${id}_in_1000x1000.jpg` : null;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function request(cfg: JustTcgConfig, path: string): Promise<ListResponse> {
  // free tier 는 rate limit(분당 10) 이 빡빡해서 429 시 지수 백오프로 재시도한다.
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(`${BASE}${path}`, { headers: { "x-api-key": cfg.apiKey } });
    if (res.ok) return res.json() as Promise<ListResponse>;
    const body = await res.text().catch(() => "");
    if (res.status === 429 && attempt < 5) {
      const wait = 5000 * 2 ** attempt; // 5s, 10s, 20s, 40s, 80s
      console.warn(`  · 429 rate limit — ${wait / 1000}s 대기 후 재시도 (${attempt + 1}/5)`);
      await sleep(wait);
      continue;
    }
    throw new Error(`JustTCG ${res.status} ${path}: ${body}`);
  }
}

async function fetchSet(cfg: JustTcgConfig, setId: string, onPage?: (remain: number) => void) {
  const out: RawCard[] = [];
  const limit = cfg.pageLimit;
  for (let offset = 0, page = 0; ; offset += limit, page++) {
    const q = new URLSearchParams({
      game: cfg.game,
      limit: String(limit),
      offset: String(offset),
    });
    if (setId) q.set("set", setId);
    const res = await request(cfg, `/cards?${q}`);
    out.push(...res.data);
    const remain = res._metadata?.apiRequestsRemaining ?? -1;
    onPage?.(remain);
    if (remain >= 0 && remain < 5) throw new Error(`API 콜 한도 임박 (남은 ${remain}) — 중단`);
    if (!res.meta?.hasMore || res.data.length === 0) break;
    if (page > 200) break;
    await sleep(7000); // free tier: 분당 10 → 페이지 사이 7초
  }
  return out;
}

/** 대상 세트들의 카드+시세를 수집. sets 비어있으면 전체. */
export async function fetchAllCards(cfg: JustTcgConfig, onPage?: (remain: number) => void): Promise<RawCard[]> {
  const targets = cfg.sets.length ? cfg.sets : [""];
  const out: RawCard[] = [];
  for (const setId of targets) {
    out.push(...(await fetchSet(cfg, setId, onPage)));
  }
  return out;
}

/**
 * 특정 세트에서 검색어로 소수의 카드만 가져온다 (프로모 개별 편입용).
 * `names` 로 카드명을 정확히(대소문자·공백 무시) 좁힌다. 보통 1콜.
 */
export async function fetchCardsByName(
  cfg: JustTcgConfig,
  setId: string,
  q: string,
  names: string[],
  onPage?: (remain: number) => void,
): Promise<RawCard[]> {
  const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();
  const want = new Set(names.map(norm));
  const params = new URLSearchParams({
    game: cfg.game,
    set: setId,
    q,
    limit: String(Math.max(cfg.pageLimit, 20)),
    offset: "0",
  });
  const res = await request(cfg, `/cards?${params}`);
  onPage?.(res._metadata?.apiRequestsRemaining ?? -1);
  return res.data.filter((c) => want.has(norm(c.name)));
}

export interface PrintRow {
  group_id: string;
  name: string;
  name_en: string;
  set_code: string | null;
  number: string | null;
  rarity: string | null;
  language: string;
  image_url: string | null;
  justtcg_card_id: string;
  tcgplayer_url: string | null;
}

export interface SnapshotRow {
  justtcg_card_id: string;
  is_headline: boolean;
  condition: string;
  printing: string;
  market_price: number | null;
  change_24h: number | null;
  change_7d: number | null;
  change_30d: number | null;
  change_90d: number | null;
  avg_price_30d: number | null;
  min_price_90d: number | null;
  max_price_90d: number | null;
  history: { t: number; p: number }[];
  currency: string;
  tcgplayer_sku: string | null;
}

/** JustTCG 세트명 → 우리 짧은 코드 (CARD_SETS 와 동일 어휘). 없으면 원문 유지. */
const SET_CODE_MAP: Record<string, string> = {
  Origins: "OGN",
  "Origins: Proving Grounds": "OGS",
  "Riftbound Organized Play Promotional Cards": "OPP",
  "Riftbound Promotional Cards": "PR",
  "Riftbound Judge Promotional Cards": "JDG",
};
const shortSetCode = (name?: string | null) =>
  name ? (SET_CODE_MAP[name] ?? name) : null;

export function groupIdFor(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function toPrintRow(c: RawCard): PrintRow {
  const lang = normLang(c.variants?.[0]?.language ?? "English");
  return {
    group_id: groupIdFor(c.name),
    name: c.name,
    name_en: c.name,
    set_code: shortSetCode(c.set_name),
    number: c.number ?? null,
    rarity: c.rarity ?? null,
    language: lang,
    image_url: tcgplayerImage(c.tcgplayerId),
    justtcg_card_id: c.id,
    tcgplayer_url: tcgplayerUrl(c.tcgplayerId),
  };
}

/** 변형들 → 스냅샷 행. 대표(is_headline)는 NM·Normal 우선, 없으면 NM·Foil, 없으면 첫 변형. */
export function toSnapshotRows(c: RawCard): SnapshotRow[] {
  const variants = c.variants ?? [];
  const rows = variants.map((v) => ({
    justtcg_card_id: c.id,
    is_headline: false,
    condition: normCondition(v.condition),
    printing: normPrinting(v.printing),
    market_price: num(v.price),
    change_24h: num(v.priceChange24hr),
    change_7d: num(v.priceChange7d),
    change_30d: num(v.priceChange30d),
    change_90d: num(v.priceChange90d),
    avg_price_30d: num(v.avgPrice30d),
    min_price_90d: num(v.minPrice90d),
    max_price_90d: num(v.maxPrice90d),
    history: Array.isArray(v.priceHistory) ? v.priceHistory : [],
    currency: "USD",
    tcgplayer_sku: v.tcgplayerSkuId ?? null,
  }));

  const headline =
    rows.find((r) => r.condition === "NM" && r.printing === "normal") ??
    rows.find((r) => r.condition === "NM") ??
    rows[0];
  if (headline) headline.is_headline = true;
  return rows;
}
