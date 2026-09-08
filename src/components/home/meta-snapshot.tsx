import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

import { getCardService } from "@/lib/services/cardService";
import type { Card } from "@/lib/types/card";
import { TIER_DECKS } from "@/lib/data/tier-list";

const DECK_HREF = "/community/deck-guide";

/** 홈 — 추천 메타(S 티어)만 간단히. 전체는 /tiers. */
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
      <div className="mb-3 flex items-end justify-between">
        <div>
          <h2 className="section-title">추천 메타 · S 티어</h2>
          <p className="text-body-sm text-ink-soft">출시 초기 예상 기준</p>
        </div>
        <Link
          href="/tiers"
          className="inline-flex shrink-0 items-center gap-1 text-label-md font-bold text-primary-strong hover:underline"
        >
          상세 덱 티어리스트 <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
        {picks.map((deck) => {
          const legend = legendByName.get(deck.legendEn);
          const art = legend?.localization.en.imageUrl ?? legend?.imageUrl;
          return (
            <li key={deck.id}>
              <Link
                href={deck.guidePostId ? `/community/post/${deck.guidePostId}` : DECK_HREF}
                className="note-card group flex h-full flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-e2"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-subcanvas">
                  {art ? (
                    <Image
                      src={art}
                      alt={deck.keyCard}
                      fill
                      sizes="(max-width:640px) 45vw, 220px"
                      className="object-cover object-top transition group-hover:scale-[1.04]"
                    />
                  ) : (
                    <div className="grid h-full place-items-center text-label-md text-ink-soft">
                      {deck.keyCard}
                    </div>
                  )}
                  <span className="absolute left-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-md bg-rose-500 text-label-sm font-black text-white">
                    S
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-0.5 px-2.5 py-2">
                  <p className="truncate text-label-lg font-bold leading-tight text-ink">
                    {deck.name}
                  </p>
                  <p className="line-clamp-1 text-label-sm text-ink-soft">{deck.subtitle}</p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
