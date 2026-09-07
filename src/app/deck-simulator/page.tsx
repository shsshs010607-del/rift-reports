import type { Metadata } from "next";

import { PageHeading } from "@/components/ui/page-heading";
import { DeckSimulator } from "@/components/deck/deck-simulator";
import { getCardService, CardServiceError } from "@/lib/services/cardService";
import {
  decodeDeck,
  deckCardIds,
  decodeDeckCode,
  buildDeckRefMaps,
  isDeckCode,
} from "@/lib/deck/deck-code";
import { EMPTY_DECK, type Deck } from "@/lib/types/deck";
import type { Card } from "@/lib/types/card";

export const metadata: Metadata = { title: "덱 시뮬레이터" };

export const dynamic = "force-dynamic";

/**
 * 덱 시뮬레이터 = 덱 빌더 + 오프닝 핸드 4장 드로우/멀리건.
 * 덱 공유: ?d=<짧은 코드> (신규) 또는 ?deck=<base64> (구버전). 카드 소스는 어댑터.
 */
export default async function DeckSimulatorPage({
  searchParams,
}: {
  searchParams: { deck?: string; d?: string };
}) {
  let deck: Deck = EMPTY_DECK;
  let resolvedCards: Card[] = [];
  let loadError = false;

  const wantShort = isDeckCode(searchParams.d);

  try {
    if (wantShort) {
      const all = await getCardService().getAllCards();
      const { idByRef } = buildDeckRefMaps(all);
      deck = decodeDeckCode(searchParams.d, idByRef) ?? EMPTY_DECK;
      const wanted = new Set(deckCardIds(deck));
      resolvedCards = all.filter((c) => wanted.has(c.id));
    } else {
      deck = decodeDeck(searchParams.deck) ?? EMPTY_DECK;
      const ids = deckCardIds(deck);
      if (ids.length > 0) {
        const all = await getCardService().getAllCards();
        const wanted = new Set(ids);
        resolvedCards = all.filter((c) => wanted.has(c.id));
      }
    }
  } catch (err) {
    if (!(err instanceof CardServiceError)) throw err;
    console.error("[deck-simulator]", err);
    loadError = true;
  }

  return (
    <div>
      <PageHeading
        title="덱 시뮬레이터"
        description="카드를 검색해 섹션별로 덱을 짜고, 오프닝 핸드 4장을 뽑아 멀리건까지 시험해 보세요. 덱은 URL로 공유됩니다."
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
