"use client";

import { useState } from "react";
import Image from "next/image";
import { AlertTriangle, Minus, Plus, X } from "lucide-react";

import type { Card } from "@/lib/types/card";
import { resolveCardText } from "@/lib/types/card";
import type { ResolvedDeck, ResolvedEntry } from "@/lib/types/deck";
import { ZONE_META } from "@/lib/types/deck";
import { type DeckIssue, zoneCounts } from "@/lib/deck/deck-model";
import { CARD_DOMAINS } from "@/lib/constants";
import { LocalizedCard } from "@/components/cards/localized-card";
import { CardText } from "@/components/cards/card-text";
import type { PoolTab } from "@/components/deck/card-pool";
import { cn } from "@/lib/utils";

const DOMAIN_COLOR = new Map(CARD_DOMAINS.map((d) => [d.slug, d.color]));

type Peek = (card: Card | null) => void;

/** 마우스를 올린 카드를 화면 좌측에 크게 미리보기 (데스크톱). */
function CardPeek({ card }: { card: Card | null }) {
  if (!card) return null;
  const ko = resolveCardText(card, "ko");
  return (
    <div className="pointer-events-none fixed left-3 top-1/2 z-50 hidden w-[270px] -translate-y-1/2 lg:block xl:left-6 xl:w-[300px]">
      <div className="overflow-hidden rounded-2xl border border-line bg-card shadow-e3">
        <LocalizedCard card={card} sizes="300px" className="!rounded-none" />
        <div className="flex flex-col gap-1.5 p-3">
          <p className="text-body-md font-bold text-ink">{ko.name}</p>
          {ko.text && (
            <CardText
              text={ko.text}
              className="text-body-sm leading-relaxed text-ink-soft"
            />
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * 섹션별 덱 목록: 레전드 → 챔피언 → 메인덱 → 전장 → 룬.
 */
export function DeckList({
  rd,
  issues,
  onChangeEntry,
  onClearLegend,
  onClearChampion,
  onFocusPool,
}: {
  rd: ResolvedDeck;
  issues: DeckIssue[];
  onChangeEntry: (id: string, delta: number) => void;
  onClearLegend: () => void;
  onClearChampion: () => void;
  onFocusPool: (tab: PoolTab) => void;
}) {
  const c = zoneCounts(rd);
  const [peek, setPeek] = useState<Card | null>(null);

  return (
    <div
      className="flex max-h-[64vh] flex-col gap-3 overflow-y-auto pr-1"
      onMouseLeave={() => setPeek(null)}
    >
      <CardPeek card={peek} />

      {/* 레전드 */}
      <Section title="레전드" n={c.legend} target="1" ok={c.legend === 1}>
        {rd.legend ? (
          <SlotRow card={rd.legend} onRemove={onClearLegend} onPeek={setPeek} />
        ) : (
          <EmptySlot label="레전드 선택" onClick={() => onFocusPool("legend")} />
        )}
      </Section>

      {/* 챔피언 */}
      <Section title="리더 챔피언" n={c.champion} target="1" ok={c.champion === 1}>
        {rd.champion ? (
          <SlotRow card={rd.champion} onRemove={onClearChampion} onPeek={setPeek} />
        ) : (
          <EmptySlot label="리더 챔피언 선택" onClick={() => onFocusPool("champion")} />
        )}
      </Section>

      {/* 메인덱 */}
      <EntrySection
        title={ZONE_META.main.label}
        subtitle="유닛 · 도구 · 주문"
        n={c.main}
        target={ZONE_META.main.targetLabel}
        ok={c.main >= ZONE_META.main.target}
        entries={rd.sections.main}
        emptyLabel="카드 추가"
        onEmpty={() => onFocusPool("main")}
        onChange={onChangeEntry}
        onPeek={setPeek}
      />

      {/* 전장 */}
      <EntrySection
        title={ZONE_META.battlefield.label}
        n={c.battlefield}
        target={ZONE_META.battlefield.targetLabel}
        ok={c.battlefield === ZONE_META.battlefield.target}
        entries={rd.sections.battlefield}
        emptyLabel="전장 추가"
        onEmpty={() => onFocusPool("battlefield")}
        onChange={onChangeEntry}
        onPeek={setPeek}
      />

      {/* 룬 */}
      <EntrySection
        title={ZONE_META.rune.label}
        n={c.rune}
        target={ZONE_META.rune.targetLabel}
        ok={c.rune === ZONE_META.rune.target}
        entries={rd.sections.rune}
        emptyLabel="룬 추가"
        onEmpty={() => onFocusPool("rune")}
        onChange={onChangeEntry}
        onPeek={setPeek}
      />

      {issues.length > 0 && (
        <div className="flex flex-col gap-1 rounded-xl bg-subcanvas/60 p-2.5">
          {issues.map((it, i) => (
            <p
              key={i}
              className={cn(
                "flex items-start gap-1.5 text-label-sm",
                it.level === "error" ? "text-error" : "text-ink-soft",
              )}
            >
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {it.message}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  subtitle,
  n,
  target,
  ok,
  children,
}: {
  title: string;
  subtitle?: string;
  n: number;
  target: string;
  ok: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-1.5">
      <h3 className="flex items-baseline justify-between px-1">
        <span className="text-label-lg font-bold text-ink">
          {title}
          {subtitle && <span className="ml-1.5 text-label-sm font-normal text-ink-soft">{subtitle}</span>}
        </span>
        <span className={cn("text-label-sm font-bold", ok ? "text-emerald" : "text-ink-soft")}>
          {n}/{target}
        </span>
      </h3>
      {children}
    </section>
  );
}

function EntrySection({
  title,
  subtitle,
  n,
  target,
  ok,
  entries,
  emptyLabel,
  onEmpty,
  onChange,
  onPeek,
}: {
  title: string;
  subtitle?: string;
  n: number;
  target: string;
  ok: boolean;
  entries: ResolvedEntry[];
  emptyLabel: string;
  onEmpty: () => void;
  onChange: (id: string, delta: number) => void;
  onPeek: Peek;
}) {
  return (
    <Section title={title} subtitle={subtitle} n={n} target={target} ok={ok}>
      {entries.length === 0 ? (
        <EmptySlot label={emptyLabel} onClick={onEmpty} />
      ) : (
        <ul className="flex flex-col">
          {entries.map((e) => (
            <EntryRow key={e.card.id} entry={e} onChange={onChange} onPeek={onPeek} />
          ))}
        </ul>
      )}
    </Section>
  );
}

function DomainBars({ card }: { card: Card }) {
  return (
    <span className="flex shrink-0 gap-0.5">
      {card.domains.length === 0 && <span className="h-3.5 w-1 rounded-full bg-line" />}
      {card.domains.map((d) => (
        <span key={d} className="h-3.5 w-1 rounded-full" style={{ backgroundColor: DOMAIN_COLOR.get(d) ?? "#999" }} />
      ))}
    </span>
  );
}

function CostBadge({ card }: { card: Card }) {
  return typeof card.cost === "number" ? (
    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-subcanvas text-label-sm font-bold text-ink-soft">
      {card.cost}
    </span>
  ) : (
    <span className="h-5 w-5 shrink-0" />
  );
}

function SlotRow({
  card,
  onRemove,
  onPeek,
}: {
  card: Card;
  onRemove: () => void;
  onPeek: Peek;
}) {
  return (
    <div
      className="flex items-center gap-2 rounded-xl border border-line bg-subcanvas/40 p-1.5"
      onMouseEnter={() => onPeek(card)}
      onMouseLeave={() => onPeek(null)}
    >
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-subcanvas">
        {card.imageUrl && (
          <Image
            src={card.imageUrl}
            alt={card.name}
            fill
            sizes="48px"
            className={card.orientation === "landscape" ? "object-contain" : "object-cover object-top"}
          />
        )}
      </div>
      <DomainBars card={card} />
      <span className="min-w-0 flex-1 truncate text-body-sm font-semibold text-ink">{card.name}</span>
      <button
        type="button"
        onClick={onRemove}
        className="grid h-7 w-7 place-items-center rounded-md text-ink-soft hover:text-error"
        aria-label="제거"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function EntryRow({
  entry,
  onChange,
  onPeek,
}: {
  entry: ResolvedEntry;
  onChange: (id: string, delta: number) => void;
  onPeek: Peek;
}) {
  const { card, qty } = entry;
  return (
    <li
      className="group flex items-center gap-2 rounded-lg px-1 py-1 hover:bg-subcanvas/60"
      onMouseEnter={() => onPeek(card)}
      onMouseLeave={() => onPeek(null)}
    >
      <DomainBars card={card} />
      <CostBadge card={card} />
      <span className="min-w-0 flex-1 truncate text-body-sm text-ink">{card.name}</span>
      <div className="flex shrink-0 items-center gap-0.5">
        <button
          type="button"
          onClick={() => onChange(card.id, -1)}
          className="grid h-6 w-6 place-items-center rounded-md text-ink-soft hover:bg-card hover:text-ink"
          aria-label="1장 빼기"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <span className="w-5 text-center text-label-md font-bold text-ink">{qty}</span>
        <button
          type="button"
          onClick={() => onChange(card.id, 1)}
          className="grid h-6 w-6 place-items-center rounded-md text-ink-soft hover:bg-card hover:text-ink"
          aria-label="1장 더"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onChange(card.id, -qty)}
          className="grid h-6 w-6 place-items-center rounded-md text-ink-soft opacity-0 transition hover:text-error group-hover:opacity-100"
          aria-label="전부 빼기"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </li>
  );
}

function EmptySlot({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-xl border-2 border-dashed border-line py-3 text-center text-label-md font-semibold text-ink-soft transition hover:border-primary/40 hover:text-primary-strong"
    >
      + {label}
    </button>
  );
}
