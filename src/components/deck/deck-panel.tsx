"use client";

import { AlertTriangle, Minus, Plus, X } from "lucide-react";

import type { Card } from "@/lib/types/card";
import type { DeckZone, ResolvedEntry } from "@/lib/types/deck";
import { type DeckIssue, groupByZone, zoneCount, ZONE_LABELS } from "@/lib/deck/deck-model";
import { CARD_DOMAINS, DECK_RULES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const DOMAIN_COLOR = new Map(CARD_DOMAINS.map((d) => [d.slug, d.color]));

const ZONE_TARGET: Partial<Record<DeckZone, string>> = {
  main: `${DECK_RULES.mainMin}+`,
  rune: String(DECK_RULES.runeCount),
  battlefield: String(DECK_RULES.battlefieldCount),
  legend: String(DECK_RULES.legendCount),
};

/** 덱 빌더 우측 패널 — 존별 카드 목록 + 장수 조절 + 규칙 검증. */
export function DeckPanel({
  resolved,
  issues,
  onChange,
}: {
  resolved: ResolvedEntry[];
  issues: DeckIssue[];
  onChange: (card: Card, delta: number) => void;
}) {
  const groups = groupByZone(resolved);
  // 짜는 순서: 레전드 → 룬 → 전장 → 메인덱(유닛·도구·주문)
  const zones: DeckZone[] = ["legend", "rune", "battlefield", "main"];
  const isEmpty = resolved.length === 0;

  return (
    <div className="flex max-h-[80vh] flex-col gap-3 overflow-y-auto rounded-2xl border border-line bg-card p-3">
      {isEmpty && (
        <p className="rounded-xl border-2 border-dashed border-line bg-subcanvas/40 p-6 text-center text-body-sm text-ink-soft">
          왼쪽에서 카드를 눌러 덱에 담으세요.
        </p>
      )}

      {zones.map((zone) => {
        const entries = groups[zone];
        if (entries.length === 0) return null;
        const n = zoneCount(resolved, zone);
        const target = ZONE_TARGET[zone];
        return (
          <section key={zone} className="flex flex-col gap-1">
            <h3 className="flex items-baseline justify-between px-1 text-label-lg font-bold text-ink">
              <span>{ZONE_LABELS[zone]}</span>
              <span className="text-label-sm font-normal text-ink-soft">
                {n}
                {target ? ` / ${target}` : ""}
              </span>
            </h3>
            <ul className="flex flex-col">
              {entries.map((e) => (
                <EntryRow key={e.card.id} entry={e} onChange={onChange} />
              ))}
            </ul>
          </section>
        );
      })}

      {issues.length > 0 && (
        <div className="mt-1 flex flex-col gap-1 rounded-xl bg-subcanvas/60 p-2.5">
          {issues.map((issue, i) => (
            <p
              key={i}
              className={cn(
                "flex items-start gap-1.5 text-label-sm",
                issue.level === "error" ? "text-error" : "text-ink-soft",
              )}
            >
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {issue.message}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

function EntryRow({
  entry,
  onChange,
}: {
  entry: ResolvedEntry;
  onChange: (card: Card, delta: number) => void;
}) {
  const { card, qty } = entry;
  return (
    <li className="group flex items-center gap-2 rounded-lg px-1 py-1 hover:bg-subcanvas/60">
      <span className="flex shrink-0 gap-0.5">
        {card.domains.length === 0 && <span className="h-3 w-1 rounded-full bg-line" />}
        {card.domains.map((d) => (
          <span
            key={d}
            className="h-3 w-1 rounded-full"
            style={{ backgroundColor: DOMAIN_COLOR.get(d) ?? "#999" }}
          />
        ))}
      </span>

      {typeof card.cost === "number" ? (
        <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-subcanvas text-label-sm font-bold text-ink-soft">
          {card.cost}
        </span>
      ) : (
        <span className="h-5 w-5 shrink-0" />
      )}

      <span className="min-w-0 flex-1 truncate text-body-sm text-ink">{card.name}</span>

      <div className="flex shrink-0 items-center gap-0.5">
        <button
          type="button"
          onClick={() => onChange(card, -1)}
          className="grid h-6 w-6 place-items-center rounded-md text-ink-soft hover:bg-card hover:text-ink"
          aria-label="1장 빼기"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <span className="w-6 text-center text-label-md font-bold text-ink">{qty}</span>
        <button
          type="button"
          onClick={() => onChange(card, 1)}
          className="grid h-6 w-6 place-items-center rounded-md text-ink-soft hover:bg-card hover:text-ink"
          aria-label="1장 더"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onChange(card, -qty)}
          className="grid h-6 w-6 place-items-center rounded-md text-ink-soft opacity-0 transition hover:text-error group-hover:opacity-100"
          aria-label="전부 빼기"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </li>
  );
}
