import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { getCardService } from "@/lib/services/cardService";
import type { Card } from "@/lib/types/card";
import { TIERS } from "@/lib/constants";
import type { Tier } from "@/lib/types/database";
import { TIER_DECKS, TIER_META } from "@/lib/data/tier-list";
import { LocalizedCard } from "@/components/cards/localized-card";
import { TierHeader } from "@/components/ui/tier-badge";

/** 덱 공략 게시판 (완성 덱 상세로 나중에 교체) */
const DECK_HREF = "/community/deck-guide";

/**
 * 덱 티어리스트 보드. 완성 덱이 없어서 카드 정보의 레전드로 채운 임시 데이터를 쓴다.
 * 덱을 누르면 덱 공략 게시판으로 이동한다.
 */
export async function TierBoard() {
  let legendByName = new Map<string, Card>();
  try {
    const legends = await getCardService().searchCards({ type: "legend" });
    legendByName = new Map(legends.map((c) => [c.localization.en.name, c]));
  } catch {
    /* 카드 못 불러와도 텍스트만 보여준다 */
  }

  return (
    <div className="flex flex-col gap-3">
      {(TIERS as readonly Tier[]).map((tier) => {
        const decks = TIER_DECKS.filter((d) => d.tier === tier);
        if (decks.length === 0) return null;
        return (
          <section key={tier} className="flex items-stretch gap-3 rounded-2xl border border-line bg-card p-3">
            <div className="flex flex-col items-center">
              <TierHeader tier={tier} />
              <span className="mt-1.5 text-label-sm font-bold text-ink-soft">{TIER_META[tier].note}</span>
            </div>
            <ul className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {decks.map((deck) => {
                const legend = legendByName.get(deck.legendEn);
                return (
                  <li key={deck.id}>
                    <Link
                      href={DECK_HREF}
                      className="flex h-full flex-col overflow-hidden rounded-xl border border-line bg-subcanvas/40 transition hover:-translate-y-0.5 hover:border-primary/40"
                    >
                      <div className="relative aspect-[744/1039] bg-subcanvas">
                        {legend ? (
                          <LocalizedCard
                            card={legend}
                            sizes="(max-width: 640px) 45vw, 200px"
                            className="!rounded-none"
                          />
                        ) : (
                          <div className="grid h-full place-items-center p-2 text-center text-label-md text-ink-soft">
                            {deck.keyCard}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-1 flex-col gap-0.5 p-2.5">
                        <p className="text-label-lg font-bold leading-tight text-ink">{deck.name}</p>
                        <p className="text-label-sm text-ink-soft">{deck.subtitle}</p>
                        <p className="mt-auto flex items-center justify-between pt-1.5 text-label-sm text-ink-soft">
                          <span>핵심: {deck.keyCard}</span>
                          <span className="inline-flex items-center gap-0.5 font-semibold text-primary-strong">
                            공략 <ArrowRight className="h-3 w-3" />
                          </span>
                        </p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
      <p className="px-1 text-label-sm text-ink-soft">
        ※ 완성 덱 데이터 연동 전 임시 표입니다. 카드 이미지는 각 덱의 레전드입니다.
      </p>
    </div>
  );
}
