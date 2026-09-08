"use client";

import { useState } from "react";

import type { Card } from "@/lib/types/card";
import { resolveCardText, cardNumber } from "@/lib/types/card";
import { CARD_DOMAINS, CARD_TYPES } from "@/lib/constants";
import { domainGradient, rarityStyle } from "@/lib/card-style";
import { BAN_TAG } from "@/lib/cards/banned";
import { CardModal } from "@/components/cards/card-modal";
import { LocalizedCard } from "@/components/cards/localized-card";

const DOMAIN_LABEL = new Map(CARD_DOMAINS.map((d) => [d.slug, d.label]));
const TYPE_LABEL = new Map(CARD_TYPES.map((t) => [t.slug, t.label]));

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
  const accent = domainGradient(card.domains);
  const rarity = rarityStyle(card.rarity);

  return (
    <button
      type="button"
      onClick={onOpen}
      style={{ ["--accent" as string]: accent, ["--ring" as string]: rarity.ring }}
      className="group relative flex h-full w-full flex-col overflow-hidden rounded-2xl border border-line bg-card text-left shadow-xs transition duration-200 hover:-translate-y-1 hover:shadow-[0_18px_36px_-14px_rgba(30,27,75,0.28)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
    >
      {/* 도메인 색 상단 스트립 */}
      <span
        aria-hidden
        className="h-1 w-full shrink-0"
        style={{ background: accent }}
      />

      <div className="relative overflow-hidden bg-subcanvas">
        <LocalizedCard
          card={card}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="!rounded-none transition duration-300 group-hover:scale-[1.04]"
        />
        {/* 호버 시 카드 위로 흐르는 광택 */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 translate-x-[-120%] bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-500 group-hover:translate-x-[120%]"
        />
        {typeof card.cost === "number" && (
          <span className="absolute left-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-ink/85 text-label-sm font-bold text-card ring-1 ring-white/30">
            {card.cost}
          </span>
        )}
        {variants > 0 && (
          <span className="absolute right-1.5 top-1.5 rounded-full bg-ink/75 px-1.5 py-0.5 text-label-sm font-bold text-card">
            +{variants} 종
          </span>
        )}
        {(card.rarity === "epic" || card.rarity === "rare") && (
          <span
            className={`absolute bottom-1.5 right-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wide ${rarity.className}`}
          >
            {rarity.label}
          </span>
        )}
        {card.subtypes.includes(BAN_TAG) && (
          <span className="absolute bottom-1.5 left-1.5 rounded bg-error px-1.5 py-0.5 text-[10px] font-black text-white">
            밴
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 p-2">
        <span className="flex shrink-0 gap-0.5">
          {card.domains.length === 0 && (
            <span className="grid h-5 w-5 place-items-center rounded-full bg-line text-[9px] font-bold text-white">
              무
            </span>
          )}
          {card.domains.map((slug) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={slug}
              src={`/domains/${slug}.svg`}
              alt={DOMAIN_LABEL.get(slug) ?? slug}
              title={DOMAIN_LABEL.get(slug) ?? slug}
              width={20}
              height={20}
              className="h-5 w-5 transition group-hover:scale-110"
            />
          ))}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-label-md font-bold text-ink transition group-hover:text-primary-strong">
            {ko.name}
          </span>
          <span className="block truncate text-label-sm text-ink-soft">
            {cardNumber(card) ?? card.setCode}
            {" · "}
            {TYPE_LABEL.get(card.type) ?? card.type}
            {typeof card.power === "number" && ` · ⚔ ${card.power}`}
          </span>
        </span>
      </div>
    </button>
  );
}
