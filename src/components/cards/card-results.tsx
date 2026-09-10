import { getCardService, CardServiceError } from "@/lib/services/cardService";
import type { Card, CardSearchQuery } from "@/lib/types/card";
import type { CardSortKey } from "@/components/cards/card-sort-bar";
import { Pagination } from "@/components/community/pagination";
import { CardGrid } from "@/components/cards/card-grid";

const collator = new Intl.Collator("ko-KR", { numeric: true, sensitivity: "base" });

/** 수집번호 "OGN-066/298" → 66 (정렬용). 숫자 없으면 큰 값으로 밀어냄. */
function numberKey(c: Card): number {
  const m = /(\d+)/.exec(c.collectorNumber ?? "");
  return m ? Number(m[1]) : Number.MAX_SAFE_INTEGER;
}

function sortCards(cards: Card[], sort: CardSortKey, dir: "asc" | "desc"): Card[] {
  const sign = dir === "asc" ? 1 : -1;
  const nullLast = (v: number | null) => (v == null ? Number.MAX_SAFE_INTEGER : v);
  const cmp: Record<CardSortKey, (a: Card, b: Card) => number> = {
    number: (a, b) => numberKey(a) - numberKey(b),
    cost: (a, b) => nullLast(a.cost) - nullLast(b.cost) || numberKey(a) - numberKey(b),
    power: (a, b) => nullLast(a.power) - nullLast(b.power) || numberKey(a) - numberKey(b),
    name: (a, b) => collator.compare(a.name, b.name),
  };
  return [...cards].sort((a, b) => sign * cmp[sort](a, b));
}

/**
 * 어댑터를 통해 카드를 가져와 그리드로 렌더하는 서버 컴포넌트.
 * - 인쇄판 그룹핑은 cardService 에서 끝난다 → 여기서는 대표(기본) 카드만 다룬다.
 * - 필터링은 전체 목록에 적용하고(총 개수 확보), 화면에는 현재 페이지분만 렌더한다.
 * - 카드 클릭 → 페이지 이동 없이 비교 모달 (CardGrid, 클라이언트).
 */
export async function CardResults({
  query,
  page,
  perPage,
  sort = "number",
  dir = "asc",
  hrefForPage,
}: {
  query: CardSearchQuery;
  page: number;
  perPage: number;
  sort?: CardSortKey;
  dir?: "asc" | "desc";
  hrefForPage: (page: number) => string;
}) {
  let all: Card[];
  try {
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

  const sorted = sortCards(all, sort, dir);
  const start = (page - 1) * perPage;
  const pageItems = sorted.slice(start, start + perPage);
  const pages = Math.ceil(sorted.length / perPage);

  return (
    <>
      <p className="mb-3 text-body-sm text-ink-soft">
        총 {all.length.toLocaleString("ko-KR")}장{pages > 1 && ` · ${page}/${pages} 페이지`}
      </p>
      <CardGrid cards={pageItems} />
      <Pagination page={page} total={all.length} perPage={perPage} hrefFor={hrefForPage} />
    </>
  );
}
