"use client";

import { useState } from "react";

import type { Card } from "@/lib/types/card";
import { resolveCardText } from "@/lib/types/card";
import { CARD_DOMAINS, CARD_RARITIES, CARD_SETS, CARD_TYPES } from "@/lib/constants";
import { CardModal } from "@/components/cards/card-modal";
import { LocalizedCard } from "@/components/cards/localized-card";

const DOMAIN_BY_SLUG = new Map(CARD_DOMAINS.map((d) => [d.slug, d]));
const TYPE_LABEL = new Map(CARD_TYPES.map((t) => [t.slug, t.label]));
const RARITY_LABEL = new Map<string, string>(CARD_RARITIES.map((r) => [r.slug, r.label]));
const SET_LABEL = new Map<string, string>(CARD_SETS.map((s) => [s.code, s.label]));

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
      <div className="relative bg-subcanvas">
        <LocalizedCard
          card={card}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="!rounded-none"
        />
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

      <div className="flex items-center gap-2 p-2">
        <span className="flex shrink-0 gap-0.5">
          {card.domains.length === 0 && <span className="h-3.5 w-1 rounded-full bg-line" />}
          {card.domains.map((slug) => (
            <span
              key={slug}
              className="h-3.5 w-1 rounded-full"
              style={{ backgroundColor: DOMAIN_BY_SLUG.get(slug)?.color ?? "#999" }}
            />
          ))}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-label-md font-bold text-ink">{ko.name}</span>
          <span className="block truncate text-label-sm text-ink-soft">
            {SET_LABEL.get(card.setCode) ?? card.setCode}
            {" · "}
            {TYPE_LABEL.get(card.type) ?? card.type}
            {" · "}
            {RARITY_LABEL.get(card.rarity) ?? card.rarity}
            {typeof card.power === "number" && ` · ⚔ ${card.power}`}
          </span>
        </span>
      </div>
    </button>
  );
}
