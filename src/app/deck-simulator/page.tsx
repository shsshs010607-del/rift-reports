import type { Metadata } from "next";

import { PageHeading } from "@/components/ui/page-heading";
import { DeckSimulator } from "@/components/deck/deck-simulator";
import { getCardService, CardServiceError } from "@/lib/services/cardService";
import { decodeDeck } from "@/lib/deck/deck-code";
import { EMPTY_DECK, type Deck } from "@/lib/types/deck";
import type { Card } from "@/lib/types/card";

export const metadata: Metadata = { title: "덱 시뮬레이터" };

// 덱은 ?deck= 파라미터로 들어오므로 정적 생성 불가.
export const dynamic = "force-dynamic";

/**
 * 덱 시뮬레이터 = 덱 빌더 + 오프닝 핸드(4장) 드로우/멀리건.
 * 덱은 URL(?deck=)에 인코딩되어 공유 가능하고, 클라이언트에서 localStorage 에도 자동 저장된다.
 * 카드 소스는 어댑터(getCardService)를 그대로 사용한다.
 */
export default async function DeckSimulatorPage({
  searchParams,
}: {
  searchParams: { deck?: string };
}) {
  const decoded = decodeDeck(searchParams.deck);
  const deck: Deck = decoded ?? EMPTY_DECK;

  // URL 덱에 들어있는 카드 id 들을 카드 상세로 해석 (없으면 조용히 버림)
  let resolvedCards: Card[] = [];
  let loadError = false;
  if (deck.entries.length > 0) {
    try {
      const all = await getCardService().getAllCards();
      const wanted = new Set(deck.entries.map((e) => e.id));
      resolvedCards = all.filter((c) => wanted.has(c.id));
    } catch (err) {
      if (!(err instanceof CardServiceError)) throw err;
      console.error("[deck-simulator]", err);
      loadError = true;
    }
  }

  return (
    <div>
      <PageHeading
        title="덱 시뮬레이터"
        description="카드를 검색해 덱을 짜고, 오프닝 핸드 4장을 뽑아 멀리건까지 시험해 보세요. 덱은 URL로 공유됩니다."
      />
      {loadError && (
        <p className="mb-4 rounded-2xl border border-error/30 bg-error/5 p-4 text-body-sm text-ink-soft">
          카드 데이터를 불러오지 못해 URL의 덱을 복원하지 못했습니다. 잠시 후 새로고침해 주세요.
        </p>
      )}
      <DeckSimulator initialDeck={deck} initialCards={resolvedCards} />
    </div>
  );
}
