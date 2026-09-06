"use client";

import { useState } from "react";
import Image from "next/image";

import type { Card } from "@/lib/types/card";
import { resolveCardText } from "@/lib/types/card";
import { CARD_DOMAINS, CARD_RARITIES, CARD_TYPES } from "@/lib/constants";
import { CardModal } from "@/components/cards/card-modal";
import { cn } from "@/lib/utils";

const DOMAIN_BY_SLUG = new Map(CARD_DOMAINS.map((d) => [d.slug, d]));
const TYPE_LABEL = new Map(CARD_TYPES.map((t) => [t.slug, t.label]));
const RARITY_LABEL = new Map<string, string>(CARD_RARITIES.map((r) => [r.slug, r.label]));

/**
 * 카드 그리드 (클라이언트). 카드를 누르면 페이지 이동 없이 비교 모달을 연다.
 * 변형 인쇄판(얼터아트·프로모 등)은 별도 타일이 아니라 기본 카드 모달 안에서 비교한다.
 */
export function CardGrid({ cards }: { cards: Card[] }) {
  const [selected, setSelected] = useState<Card | null>(null);

  return (
    <>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {cards.map((card) => (
          <li key={card.id}>
            <CardTile card={card} onOpen={() => setSelected(card)} />
          </li>
        ))}
      </ul>
      {selected && <CardModal card={selected} onClose={() => setSelected(null)} />}
    </>
  );
}

function CardTile({ card, onOpen }: { card: Card; onOpen: () => void }) {
  const ko = resolveCardText(card, "ko");
  const variants = card.printings.length - 1;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex h-full w-full flex-col overflow-hidden rounded-2xl border border-line bg-card text-left transition hover:-translate-y-0.5 hover:border-primary/40"
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
        {variants > 0 && (
          <span className="absolute right-1.5 top-1.5 rounded-full bg-ink/70 px-1.5 py-0.5 text-label-sm font-bold text-card">
            +{variants} 종
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
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d?.color ?? "#999" }} />
                {d?.label ?? slug}
              </span>
            );
          })}
          <span className="chip">{TYPE_LABEL.get(card.type) ?? card.type}</span>
          <span className={cn("rounded-full bg-subcanvas px-1.5 py-0.5 text-label-sm text-ink-soft")}>
            {RARITY_LABEL.get(card.rarity) ?? card.rarity}
          </span>
        </div>

        {ko.text && <p className="mt-0.5 line-clamp-3 text-body-sm text-ink-soft">{ko.text}</p>}

        <p className="mt-auto pt-1 text-label-sm text-ink-soft/70">
          {card.setCode}
          {card.collectorNumber ? ` · ${card.collectorNumber}` : ""}
        </p>
      </div>
    </button>
  );
}
