import Image from "next/image";
import Link from "next/link";

import { getCardService, CardServiceError } from "@/lib/services/cardService";
import { resolveCardText, type Card, type CardSearchQuery } from "@/lib/types/card";
import { CARD_DOMAINS, CARD_RARITIES, CARD_TYPES } from "@/lib/constants";
import { Pagination } from "@/components/community/pagination";

/**
 * 어댑터를 통해 카드를 가져와 그리드로 렌더하는 서버 컴포넌트 (예시).
 *
 * - 데이터 소스(오픈소스/공식)는 getCardService() 가 알아서 고른다 → 이 컴포넌트는 무관.
 * - 필터링은 전체 목록에 적용하고(총 개수 확보), 화면에는 현재 페이지분만 렌더한다.
 * - 예외는 여기서 흡수해 "에러 상태"를 그린다(페이지 전체가 죽지 않도록).
 * - 로딩 상태는 부모의 <Suspense fallback> 이 담당한다.
 */
export async function CardResults({
  query,
  page,
  perPage,
  hrefForPage,
}: {
  query: CardSearchQuery;
  page: number;
  perPage: number;
  hrefForPage: (page: number) => string;
}) {
  let all: Card[];
  try {
    // limit/offset 없이 호출 → 필터만 적용된 전체 목록
    all = await getCardService().searchCards({ ...query, limit: undefined, offset: undefined });
  } catch (err) {
    const message =
      err instanceof CardServiceError
        ? "카드 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."
        : "예상치 못한 오류가 발생했습니다.";
    console.error("[CardResults]", err);
    return (
      <div className="rounded-2xl border border-error/30 bg-error/5 p-6 text-center text-body-sm text-ink-soft">
        {message}
      </div>
    );
  }

  if (all.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-line bg-subcanvas/40 p-10 text-center">
        <p className="font-display text-title-md text-ink">검색 결과가 없습니다</p>
        <p className="mt-1 text-body-sm text-ink-soft">조건을 바꾸거나 필터를 지워 보세요.</p>
      </div>
    );
  }

  const start = (page - 1) * perPage;
  const pageItems = all.slice(start, start + perPage);

  return (
    <>
      <p className="mb-3 text-body-sm text-ink-soft">
        총 {all.length.toLocaleString("ko-KR")}장
        {all.length > perPage && ` · ${page}/${Math.ceil(all.length / perPage)} 페이지`}
      </p>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {pageItems.map((card) => (
          <li key={card.id}>
            <CardTile card={card} />
          </li>
        ))}
      </ul>
      <Pagination page={page} total={all.length} perPage={perPage} hrefFor={hrefForPage} />
    </>
  );
}

const DOMAIN_BY_SLUG = new Map(CARD_DOMAINS.map((d) => [d.slug, d]));
const TYPE_LABEL = new Map(CARD_TYPES.map((t) => [t.slug, t.label]));
const RARITY_LABEL = new Map<string, string>(CARD_RARITIES.map((r) => [r.slug, r.label]));

function CardTile({ card }: { card: Card }) {
  const ko = resolveCardText(card, "ko");

  return (
    <Link
      href={`/cards/${encodeURIComponent(card.id)}`}
      className="flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-card transition hover:-translate-y-0.5 hover:border-primary/40"
    >
      <div className="relative aspect-[5/7] bg-subcanvas">
        {card.imageUrl ? (
          <Image
            src={card.imageUrl}
            alt={ko.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover"
          />
        ) : (
          <div className="grid h-full place-items-center p-2 text-center text-label-lg text-ink-soft">
            {ko.name}
          </div>
        )}
        {typeof card.cost === "number" && (
          <span className="absolute left-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-ink/80 text-label-sm font-bold text-card">
            {card.cost}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-2.5">
        <div className="flex items-start justify-between gap-1.5">
          <h3 className="text-label-lg font-semibold leading-tight text-ink">{ko.name}</h3>
          {typeof card.power === "number" && (
            <span className="shrink-0 text-label-sm text-ink-soft">⚔ {card.power}</span>
          )}
        </div>

        <div className="flex flex-wrap gap-1">
          {card.domains.map((slug) => {
            const d = DOMAIN_BY_SLUG.get(slug);
            return (
              <span
                key={slug}
                className="inline-flex items-center gap-1 rounded-full border border-line px-1.5 py-0.5 text-label-sm text-ink-soft"
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: d?.color ?? "#999" }}
                />
                {d?.label ?? slug}
              </span>
            );
          })}
          <span className="chip">{TYPE_LABEL.get(card.type) ?? card.type}</span>
          <span className="rounded-full bg-subcanvas px-1.5 py-0.5 text-label-sm text-ink-soft">
            {RARITY_LABEL.get(card.rarity) ?? card.rarity}
          </span>
        </div>

        {ko.text && (
          <p className="mt-0.5 line-clamp-3 text-body-sm text-ink-soft">{ko.text}</p>
        )}

        <p className="mt-auto pt-1 text-label-sm text-ink-soft/70">
          {card.setCode}
          {card.collectorNumber ? ` · ${card.collectorNumber}` : ""}
        </p>
      </div>
    </Link>
  );
}
