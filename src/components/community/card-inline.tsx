"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import type { Card } from "@/lib/types/card";
import { CARD_DOMAINS } from "@/lib/constants";
import { LocalizedCard } from "@/components/cards/localized-card";

const DOMAIN_COLOR = Object.fromEntries(CARD_DOMAINS.map((d) => [d.slug, d.color]));

const cache = new Map<string, Promise<Card | null>>();

function lookup(name: string): Promise<Card | null> {
  const key = name.trim().toLowerCase();
  if (!key) return Promise.resolve(null);
  if (!cache.has(key)) {
    cache.set(
      key,
      fetch(`/api/cards?q=${encodeURIComponent(name.trim())}&limit=12`)
        .then((r) => (r.ok ? r.json() : { cards: [] }))
        .then((d: { cards: Card[] }) => {
          const cards = d.cards ?? [];
          const lc = name.trim().toLowerCase();
          return (
            cards.find(
              (c) =>
                c.name.toLowerCase() === lc ||
                c.localization.en.name.toLowerCase() === lc,
            ) ??
            cards.find((c) => c.name.toLowerCase().includes(lc)) ??
            cards[0] ??
            null
          );
        })
        .catch(() => null),
    );
  }
  return cache.get(key)!;
}

/** 커뮤니티 글 본문의 `[[카드명]]` → 카드 이미지 (클릭 시 카드 검색). */
export function CardInline({ name }: { name: string }) {
  const [card, setCard] = useState<Card | null | undefined>(undefined);

  useEffect(() => {
    let live = true;
    lookup(name).then((c) => live && setCard(c));
    return () => {
      live = false;
    };
  }, [name]);

  if (card === undefined) {
    return (
      <span className="mx-0.5 inline-block h-5 w-24 animate-pulse rounded bg-subcanvas align-middle" />
    );
  }
  if (!card) {
    return (
      <span className="mx-0.5 rounded bg-subcanvas px-1 text-body-sm text-ink-soft">
        [[{name}]]
      </span>
    );
  }

  const wide = card.orientation === "landscape";

  return (
    <Link
      href={`/cards?q=${encodeURIComponent(card.name)}`}
      title={card.name}
      className={`my-1 mr-2 inline-block max-w-[45%] overflow-hidden rounded-lg border border-line bg-card align-top shadow-xs transition hover:-translate-y-0.5 hover:shadow-e2 ${
        wide ? "w-52" : "w-36"
      }`}
    >
      <LocalizedCard card={card} sizes="200px" className="!rounded-none" />
      <span className="flex items-center gap-1 px-1.5 py-1">
        {typeof card.cost === "number" && (
          <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-subcanvas text-[10px] font-black text-ink-soft">
            {card.cost}
          </span>
        )}
        <span className="flex shrink-0 gap-0.5">
          {card.domains.map((d) => (
            <span
              key={d}
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: DOMAIN_COLOR[d] ?? "#999" }}
            />
          ))}
        </span>
        <span className="truncate text-label-sm font-bold text-ink">{card.name}</span>
      </span>
    </Link>
  );
}
