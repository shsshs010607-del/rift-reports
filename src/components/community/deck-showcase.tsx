"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Layers, ArrowUpRight, Copy, Check } from "lucide-react";
import type { Card } from "@/lib/types/card";
import type { Deck } from "@/lib/types/deck";
import {
  decodeDeck,
  decodeDeckCode,
  isDeckCode,
  buildDeckRefMaps,
} from "@/lib/deck/deck-code";
import { CARD_TYPES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const TYPE_ORDER = ["unit", "spell", "gear", "rune", "battlefield", "champion"] as const;
const TYPE_LABEL: Record<string, string> = Object.fromEntries(
  CARD_TYPES.map((t) => [t.slug, t.label]),
);

/** 덱공략 글 본문의 ```deck 블록 → 덱 미리보기 카드. */
export function DeckShowcase({ code }: { code: string }) {
  const [cards, setCards] = useState<Card[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/api/cards?limit=500")
      .then((r) => r.json())
      .then((d) => alive && setCards((d.cards as Card[]) ?? []))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, []);

  const byId = useMemo(() => new Map((cards ?? []).map((c) => [c.id, c])), [cards]);

  const deck: Deck | null = useMemo(() => {
    if (!cards) return null;
    if (isDeckCode(code)) {
      const { idByRef } = buildDeckRefMaps(cards);
      return decodeDeckCode(code, idByRef);
    }
    return decodeDeck(code);
  }, [cards, code]);

  const openHref = `/deck-simulator?${isDeckCode(code) ? "d" : "deck"}=${encodeURIComponent(code)}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* 무시 */
    }
  };

  if (failed || (cards && !deck)) {
    return (
      <div className="my-4 rounded-2xl border border-line/70 bg-card p-4">
        <p className="text-body-sm text-ink-soft">덱 코드를 해석할 수 없습니다.</p>
        <pre className="mt-2 overflow-x-auto rounded-lg bg-subcanvas/60 p-2 text-[12px] text-ink">
          {code}
        </pre>
        <Link href={openHref} className="mt-2 inline-flex text-label-sm font-bold text-primary-strong">
          덱 시뮬레이터에서 열기 →
        </Link>
      </div>
    );
  }

  if (!deck) {
    return (
      <div className="my-4 h-40 animate-pulse rounded-2xl border border-line/70 bg-subcanvas/50" />
    );
  }

  const legend = deck.legendId ? byId.get(deck.legendId) : undefined;
  const champion = deck.championId ? byId.get(deck.championId) : undefined;
  const legendArt = legend?.localization.en.imageUrl ?? legend?.imageUrl;

  const resolved = deck.entries
    .map((e) => ({ card: byId.get(e.id), qty: e.qty }))
    .filter((x): x is { card: Card; qty: number } => Boolean(x.card));

  const groups = TYPE_ORDER.map((t) => ({
    type: t,
    items: resolved.filter((r) => r.card.type === t).sort((a, b) => (a.card.cost ?? 0) - (b.card.cost ?? 0)),
  })).filter((g) => g.items.length > 0);

  const mainCount = resolved
    .filter((r) => ["unit", "spell", "gear", "champion"].includes(r.card.type))
    .reduce((s, r) => s + r.qty, 0);

  return (
    <div className="my-5 overflow-hidden rounded-2xl border border-line bg-card">
      {/* 헤더 — 레전드 배너 */}
      <div className="relative flex items-end gap-3 overflow-hidden p-4">
        {legendArt && (
          <Image
            src={legendArt}
            alt=""
            fill
            sizes="640px"
            className="object-cover object-top opacity-20 blur-[1px]"
          />
        )}
        <div className="relative flex items-center gap-3">
          {legendArt && (
            <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl ring-1 ring-line">
              <Image src={legendArt} alt={legend?.name ?? ""} fill sizes="64px" className="object-cover object-top" />
            </span>
          )}
          <div>
            <p className="flex items-center gap-1.5 text-label-sm font-bold text-primary-strong">
              <Layers className="h-3.5 w-3.5" /> 덱 리스트
            </p>
            <p className="font-display text-title-md font-bold text-ink">
              {legend?.name ?? "레전드 미지정"}
              {champion && <span className="text-ink-soft"> · {champion.name}</span>}
            </p>
            <p className="text-body-sm text-ink-soft">
              메인 {mainCount}장 · 룬 {resolved.filter((r) => r.card.type === "rune").reduce((s, r) => s + r.qty, 0)} · 전장{" "}
              {resolved.filter((r) => r.card.type === "battlefield").reduce((s, r) => s + r.qty, 0)}
            </p>
          </div>
        </div>
      </div>

      {/* 카드 그룹 */}
      <div className="flex flex-col gap-3 border-t border-line/60 p-3">
        {groups.map((g) => (
          <div key={g.type}>
            <p className="mb-1.5 px-1 text-label-sm font-bold text-ink-soft">
              {TYPE_LABEL[g.type] ?? g.type} · {g.items.reduce((s, r) => s + r.qty, 0)}
            </p>
            <ul className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 md:grid-cols-6">
              {g.items.map(({ card, qty }) => {
                const art = card.localization.en.imageUrl ?? card.imageUrl;
                return (
                  <li
                    key={card.id}
                    className="overflow-hidden rounded-lg border border-line/70 bg-subcanvas"
                  >
                    <div
                      className={cn(
                        "relative overflow-hidden bg-subcanvas",
                        card.orientation === "landscape" ? "aspect-[16/10]" : "aspect-[3/2]",
                      )}
                    >
                      {art && (
                        <Image
                          src={art}
                          alt={card.name}
                          fill
                          sizes="120px"
                          className="object-cover object-top"
                        />
                      )}
                      <span className="absolute right-1 top-1 rounded bg-ink/85 px-1 text-[11px] font-black text-white">
                        {qty}
                      </span>
                    </div>
                    <p className="truncate px-1.5 py-1 text-[11px] font-medium leading-tight text-ink">
                      {card.name}
                    </p>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* 액션 */}
      <div className="flex flex-wrap gap-2 border-t border-line/60 p-3">
        <Link
          href={openHref}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-2 text-label-sm font-bold text-white"
        >
          덱 시뮬레이터에서 열기
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1.5 rounded-full border border-line px-3.5 py-2 text-label-sm font-bold text-ink-soft hover:text-ink"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "복사됨" : "덱 코드 복사"}
        </button>
      </div>
    </div>
  );
}
