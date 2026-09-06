import { getCardService, CardServiceError } from "@/lib/services/cardService";
import type { Card, CardSearchQuery } from "@/lib/types/card";
import { Pagination } from "@/components/community/pagination";
import { CardGrid } from "@/components/cards/card-grid";

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
  hrefForPage,
}: {
  query: CardSearchQuery;
  page: number;
  perPage: number;
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

  const start = (page - 1) * perPage;
  const pageItems = all.slice(start, start + perPage);
  const pages = Math.ceil(all.length / perPage);

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
