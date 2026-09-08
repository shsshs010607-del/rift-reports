import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

import { getCardService } from "@/lib/services/cardService";
import type { Card } from "@/lib/types/card";
import { TIER_DECKS } from "@/lib/data/tier-list";

const DECK_HREF = "/community/deck-guide";

/** 홈 — 추천 메타(S 티어) 압축. 전체는 /tiers. */
export async function MetaSnapshot() {
  let legendByName = new Map<string, Card>();
  try {
    const legends = await getCardService().searchCards({ type: "legend" });
    legendByName = new Map(legends.map((c) => [c.localization.en.name, c]));
  } catch {
    /* 이미지 없이도 렌더 */
  }

  const picks = TIER_DECKS.filter((d) => d.tier === "S");
  if (picks.length === 0) return null;

  return (
    <section>
      <div className="mb-2.5 flex items-center justify-between">
        <h2 className="flex items-center gap-1.5 font-display text-title-md font-bold text-ink">
          <span className="grid h-5 w-5 place-items-center rounded bg-rose-500 text-[11px] font-black text-white">
            S
          </span>
          추천 메타
        </h2>
        <Link
          href="/tiers"
          className="inline-flex shrink-0 items-center gap-0.5 text-label-sm font-bold text-primary-strong hover:underline"
        >
          티어리스트 <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <ul className="grid grid-cols-3 gap-2">
        {picks.map((deck) => {
          const legend = legendByName.get(deck.legendEn);
          const art = legend?.localization.en.imageUrl ?? legend?.imageUrl;
          return (
            <li key={deck.id}>
              <Link
                href={deck.guidePostId ? `/community/post/${deck.guidePostId}` : DECK_HREF}
                className="note-card group flex h-full items-center gap-2 overflow-hidden p-1.5 pr-4 transition hover:-translate-y-0.5 hover:shadow-e2 sm:flex-col sm:items-stretch sm:gap-0 sm:p-0"
              >
                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-subcanvas sm:h-auto sm:w-full sm:rounded-none sm:aspect-[16/10]">
                  {art ? (
                    <Image
                      src={art}
                      alt={deck.keyCard}
                      fill
                      sizes="(max-width:640px) 44px, 240px"
                      className="object-cover object-top transition group-hover:scale-[1.04]"
                    />
                  ) : (
                    <div className="grid h-full place-items-center text-[10px] text-ink-soft">
                      {deck.keyCard}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1 sm:px-2 sm:py-1.5">
                  <p className="truncate text-label-md font-bold leading-tight text-ink">
                    {deck.name}
                  </p>
                  <p className="line-clamp-1 text-[11px] text-ink-soft">{deck.subtitle}</p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
