import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { BookMarked } from "lucide-react";
import { PageHeading } from "@/components/ui/page-heading";
import { AdSenseUnit } from "@/components/ads/adsense-unit";
import { CardSearchBox } from "@/components/cards/card-search-box";
import { CardResults } from "@/components/cards/card-results";
import { CardFilterBar } from "@/components/cards/card-filter-bar";
import { getCardFacets } from "@/lib/services/cardService";
import { findGlossaryMatches } from "@/content/glossary";
import {
  CARD_DOMAIN_SLUGS,
  CARD_RARITY_SLUGS,
  CARD_SET_CODES,
  CARD_TYPE_SLUGS,
  type CardSearchQuery,
} from "@/lib/types/card";

export const metadata: Metadata = { title: "카드 정보" };

// searchParams 기반 필터 + useSearchParams 클라이언트 필터바 → 동적 렌더.
export const dynamic = "force-dynamic";

/**
 * 카드 검색 계약:
 *   ?q=<텍스트>   카드명(name/name_en) + 룰 텍스트(text) 전문 검색 — 용어(영문 canonical)로도 검색 가능
 *   ?domain=<slug> ?type=<slug> ?cost=<n> ?rarity=<slug> ?setCode=<code>   필터
 * 용어를 검색하면 아래처럼 관련 용어 설명으로 안내한다.
 *
 * 카드 데이터는 서비스 어댑터(@/lib/services/cardService)를 통해 가져온다.
 * 소스(오픈소스 JSON / Riot 공식 API)는 NEXT_PUBLIC_DATA_SOURCE 로 결정되며 이 페이지는 무관하다.
 */
type RawSearchParams = Record<string, string | string[] | undefined>;

function pick<T extends readonly string[]>(
  value: string | string[] | undefined,
  allowed: T,
): T[number] | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  return v && (allowed as readonly string[]).includes(v) ? (v as T[number]) : undefined;
}

function buildQuery(sp: RawSearchParams): CardSearchQuery {
  const q = (Array.isArray(sp.q) ? sp.q[0] : sp.q)?.trim() || undefined;
  const costRaw = Array.isArray(sp.cost) ? sp.cost[0] : sp.cost;
  const cost = costRaw != null && Number.isFinite(Number(costRaw)) ? Number(costRaw) : undefined;
  const setRaw = (Array.isArray(sp.setCode) ? sp.setCode[0] : sp.setCode)?.trim().toUpperCase();

  return {
    q,
    domain: pick(sp.domain, CARD_DOMAIN_SLUGS),
    type: pick(sp.type, CARD_TYPE_SLUGS),
    rarity: pick(sp.rarity, CARD_RARITY_SLUGS),
    cost,
    setCode: setRaw && (CARD_SET_CODES as readonly string[]).includes(setRaw) ? setRaw : undefined,
  };
}

const PER_PAGE = 36;

export default function CardsPage({ searchParams }: { searchParams: RawSearchParams }) {
  const query = buildQuery(searchParams);
  const q = query.q ?? "";
  const termHits = q ? findGlossaryMatches(q).slice(0, 4) : [];

  const pageRaw = Number(Array.isArray(searchParams.page) ? searchParams.page[0] : searchParams.page);
  const page = Number.isFinite(pageRaw) && pageRaw >= 1 ? Math.floor(pageRaw) : 1;

  // 필터가 걸린 쿼리스트링을 유지하며 page 만 바꾸는 링크 생성기
  const hrefForPage = (next: number) => {
    const sp = new URLSearchParams();
    if (query.q) sp.set("q", query.q);
    if (query.domain) sp.set("domain", query.domain);
    if (query.type) sp.set("type", query.type);
    if (query.rarity) sp.set("rarity", String(query.rarity));
    if (typeof query.cost === "number") sp.set("cost", String(query.cost));
    if (query.setCode) sp.set("setCode", query.setCode);
    if (next > 1) sp.set("page", String(next));
    const qs = sp.toString();
    return qs ? `/cards?${qs}` : "/cards";
  };

  return (
    <div>
      <PageHeading
        title="카드 정보 (Card DB)"
        description="카드명·효과 텍스트 검색 + 도메인 / 타입 / 확장팩 / 레어도 필터"
      />

      <CardSearchBox initial={q} />

      {termHits.length > 0 && (
        <div className="mt-4 rounded-2xl border border-primary/20 bg-primary-wash/60 p-4">
          <p className="mb-2 flex items-center gap-1.5 text-label-lg text-primary-strong">
            <BookMarked className="h-4 w-4" />
            &ldquo;{q}&rdquo; 관련 용어
          </p>
          <ul className="flex flex-col gap-2">
            {termHits.map((t) => (
              <li key={t.en} className="text-body-sm text-ink-soft">
                <Link href={`/glossary#term-${t.en}`} className="font-semibold text-ink hover:text-primary-strong">
                  {t.term} <span className="text-ink-soft">({t.en})</span>
                </Link>
                {" — "}
                {t.definition.slice(0, 80)}…
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
        {/* 필터 — 데스크톱 우측 고정, 모든 필터 한눈에 */}
        <div className="xl:order-2 xl:sticky xl:top-[128px] xl:max-h-[calc(100vh-144px)] xl:overflow-y-auto xl:pr-1">
          <Suspense fallback={<div className="h-28" />}>
            <CardFilterPanel query={query} />
          </Suspense>
        </div>

        <div className="min-w-0 xl:order-1">
          <Suspense fallback={<CardResultsSkeleton />}>
            <CardResults query={query} page={page} perPage={PER_PAGE} hrefForPage={hrefForPage} />
          </Suspense>
          <AdSenseUnit className="mt-8" />
        </div>
      </div>
    </div>
  );
}

/** 필터 패널 — 카드 분포(패싯) 집계를 곁들여 렌더. */
async function CardFilterPanel({ query }: { query: CardSearchQuery }) {
  const facets = await getCardFacets(query).catch(() => null);
  return <CardFilterBar facets={facets} />;
}

/** 로딩 상태 — 카드 그리드 자리를 잡아 레이아웃 시프트를 막는다. */
function CardResultsSkeleton() {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4" aria-hidden>
      {Array.from({ length: 8 }).map((_, i) => (
        <li
          key={i}
          className="aspect-[5/7] animate-pulse rounded-2xl border border-line bg-subcanvas/60"
        />
      ))}
    </ul>
  );
}
