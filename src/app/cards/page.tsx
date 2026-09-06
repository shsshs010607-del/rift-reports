import type { Metadata } from "next";
import Link from "next/link";
import { BookMarked } from "lucide-react";
import { PageHeading, ComingSoon } from "@/components/ui/page-heading";
import { CardSearchBox } from "@/components/cards/card-search-box";
import { findGlossaryMatches } from "@/content/glossary";
import { CARD_DOMAINS, CARD_TYPES } from "@/lib/constants";

export const metadata: Metadata = { title: "카드 정보" };

/**
 * 카드 검색 계약:
 *   ?q=<텍스트>   카드명(name/name_en) + 룰 텍스트(text) 전문 검색 — 용어(영문 canonical)로도 검색 가능
 *   ?domain=<slug> ?type=<slug> ?cost=<n> ?rarity=<slug>   필터
 * 용어를 검색하면 아래처럼 관련 용어 설명으로 안내한다(카드 데이터 연동 전에도 동작).
 */
export default function CardsPage({ searchParams }: { searchParams: { q?: string } }) {
  const q = (searchParams.q ?? "").trim();
  const termHits = q ? findGlossaryMatches(q).slice(0, 4) : [];

  return (
    <div>
      <PageHeading
        title="카드 정보 (Card DB)"
        description="카드명·효과 텍스트 검색 + 도메인/코스트/타입/레어도 필터"
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
                <Link href={`/rules#term-${t.en}`} className="font-semibold text-ink hover:text-primary-strong">
                  {t.term} <span className="text-ink-soft">({t.en})</span>
                </Link>
                {" — "}
                {t.definition.slice(0, 80)}…
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-1.5">
        {CARD_DOMAINS.map((d) => (
          <span
            key={d.slug}
            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-2.5 py-1 text-body-sm text-ink-soft"
          >
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
            {d.label}
          </span>
        ))}
        {CARD_TYPES.map((t) => (
          <span key={t.slug} className="chip">
            {t.label}
          </span>
        ))}
      </div>

      <div className="mt-6">
        <ComingSoon note="카드 데이터(Riot API / 수기 임포트) 연동 후 이 자리에 카드 그리드(5:7, 레어도 테두리)와 상세 모달이 들어갑니다. 데이터: cards 테이블, 검색은 search_tsv + pg_trgm." />
      </div>
    </div>
  );
}
