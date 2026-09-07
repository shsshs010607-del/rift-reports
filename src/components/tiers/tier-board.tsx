import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { getCardService } from "@/lib/services/cardService";
import type { Card } from "@/lib/types/card";
import { TIERS, TIER_STYLES } from "@/lib/constants";
import type { Tier } from "@/lib/types/database";
import { TIER_DECKS, TIER_META } from "@/lib/data/tier-list";
import { LocalizedCard } from "@/components/cards/localized-card";
import { cn } from "@/lib/utils";

const DECK_HREF = "/community/deck-guide";

/**
 * 덱 티어리스트 보드 (S·A·B·C·Z). 완성 덱 연동 전까지 레전드 기준 임시 데이터.
 */
export async function TierBoard() {
  let legendByName = new Map<string, Card>();
  try {
    const legends = await getCardService().searchCards({ type: "legend" });
    legendByName = new Map(legends.map((c) => [c.localization.en.name, c]));
  } catch {
    /* 카드 못 불러와도 텍스트만 */
  }

  return (
    <div className="flex flex-col gap-3">
      {(TIERS as readonly Tier[]).map((tier) => {
        const decks = TIER_DECKS.filter((d) => d.tier === tier);
        if (decks.length === 0) return null;
        const s = TIER_STYLES[tier];
        return (
          <section
            key={tier}
            className="flex items-stretch overflow-hidden rounded-2xl border border-line bg-card"
          >
            {/* 티어 레터 — 색 바 */}
            <div
              className={cn(
                "flex w-16 shrink-0 flex-col items-center justify-center gap-0.5 py-3 text-white sm:w-20",
                s.headerBg,
              )}
            >
              <span className="font-display text-[32px] font-black leading-none sm:text-[40px]">
                {s.label}
              </span>
              <span className="text-[11px] font-bold opacity-90">{TIER_META[tier].note}</span>
            </div>

            <ul className="grid flex-1 grid-cols-2 gap-2.5 p-3 sm:grid-cols-3 lg:grid-cols-4">
              {decks.map((deck) => {
                const legend = legendByName.get(deck.legendEn);
                return (
                  <li key={deck.id}>
                    <Link
                      href={deck.guidePostId ? `/community/post/${deck.guidePostId}` : DECK_HREF}
                      className="flex h-full flex-col overflow-hidden rounded-xl border border-line/70 bg-subcanvas/40 transition hover:-translate-y-0.5 hover:border-primary/40"
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
                        <p className="mt-auto flex items-center justify-end pt-1.5 text-label-sm">
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
