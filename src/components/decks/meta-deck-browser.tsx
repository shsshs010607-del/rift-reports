"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Copy,
  ExternalLink,
  Heart,
  Layers,
  Trash2,
  Trophy,
} from "lucide-react";

import { CARD_DOMAINS } from "@/lib/constants";
import { normLegend } from "@/lib/legend-name";
import type { MetaDeck } from "@/lib/meta-decks";
import { deleteMetaDeck } from "@/app/admin/actions";
import { cn } from "@/lib/utils";

const DOMAIN = Object.fromEntries(CARD_DOMAINS.map((d) => [d.slug, d]));
const shortLegend = (name: string | null) => (name ?? "").split(/[,–-]/)[0].trim() || "레전드";

export function MetaDeckBrowser({
  decks,
  images,
  initialLegend,
  isStaff = false,
}: {
  decks: MetaDeck[];
  images: Record<string, string>;
  initialLegend?: string;
  isStaff?: boolean;
}) {
  const [list, setList] = useState(decks);
  const legends = useMemo(() => {
    const m = new Map<string, number>();
    for (const d of list) if (d.legend_name) m.set(d.legend_name, (m.get(d.legend_name) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [list]);

  // initialLegend(영문명 등)를 정규화 매칭으로 실제 legend_name 에 대응
  const matchedInitial = useMemo(() => {
    if (!initialLegend) return null;
    const k = normLegend(initialLegend);
    const first2 = k.split(" ").slice(0, 2).join(" ");
    return legends.find(([n]) => normLegend(n) === k || normLegend(n).startsWith(first2))?.[0] ?? null;
  }, [initialLegend, legends]);

  const [legend, setLegend] = useState<string | null>(matchedInitial);
  const [tourneyOnly, setTourneyOnly] = useState(false);
  const [deleting, startDelete] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const shown = list.filter(
    (d) => (!legend || d.legend_name === legend) && (!tourneyOnly || d.is_tournament),
  );
  const tourneyCount = list.filter((d) => d.is_tournament).length;

  const onDelete = (deck: MetaDeck) => {
    if (!confirm(`메타 덱 "${deck.name}" 을(를) 삭제할까요?`)) return;
    startDelete(async () => {
      const res = await deleteMetaDeck(deck.id);
      if (res.error) setErr(res.error);
      else {
        setErr(null);
        setList((r) => r.filter((x) => x.id !== deck.id));
      }
    });
  };

  return (
    <div className="mt-4">
      {/* 필터 바 */}
      <div className="flex flex-col gap-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setTourneyOnly((v) => !v)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-label-sm font-bold transition",
              tourneyOnly
                ? "border-amber-500 bg-amber-500/12 text-amber-700 dark:text-amber-300"
                : "border-line bg-card text-ink-soft hover:text-ink",
            )}
          >
            <Trophy className="h-3.5 w-3.5" />
            대회 덱만 ({tourneyCount})
          </button>
          <span className="text-label-sm text-ink-soft">
            총 <b className="text-ink">{shown.length}</b>덱 · 현행 룰(밴 반영)
          </span>
          {isStaff && (
            <span className="rounded-full bg-primary/12 px-2 py-0.5 text-[11px] font-bold text-primary-strong">
              운영진 · 카드에서 삭제 가능
            </span>
          )}
        </div>
        {err && <p className="text-body-sm text-coral">{err}</p>}

        {legends.length > 1 && (
          <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <LegendChip on={legend === null} onClick={() => setLegend(null)}>
              전체 {list.length}
            </LegendChip>
            {legends.map(([name, n]) => (
              <LegendChip key={name} on={legend === name} onClick={() => setLegend(name)}>
                {shortLegend(name)} {n}
              </LegendChip>
            ))}
          </div>
        )}
      </div>

      {shown.length === 0 ? (
        <p className="py-14 text-center text-body-sm text-ink-soft">해당하는 덱이 없습니다.</p>
      ) : (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {shown.map((d) => (
            <DeckCard
              key={d.id}
              deck={d}
              img={d.legend_ref ? images[d.legend_ref] : undefined}
              onDelete={isStaff ? () => onDelete(d) : undefined}
              deleting={deleting}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function LegendChip({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full border px-3 py-1.5 text-label-sm font-bold transition",
        on
          ? "border-primary bg-primary text-white"
          : "border-line bg-card text-ink-soft hover:border-primary/40 hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}

function DeckCard({
  deck,
  img,
  onDelete,
  deleting,
}: {
  deck: MetaDeck;
  img?: string;
  onDelete?: () => void;
  deleting?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(deck.deck_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* noop */
    }
  };

  return (
    <div className="flex overflow-hidden rounded-2xl border border-line/70 bg-card">
      {/* 레전드 아트 */}
      <div className="relative w-[84px] shrink-0 bg-subcanvas sm:w-[104px]">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={img}
            alt=""
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover object-[50%_18%]"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center">
            <span className="flex gap-1">
              {deck.domains.map((dm) => (
                <span
                  key={dm}
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: DOMAIN[dm]?.color ?? "#888" }}
                />
              ))}
            </span>
          </div>
        )}
      </div>

      {/* 정보 */}
      <div className="flex min-w-0 flex-1 flex-col p-3">
        <div className="flex items-start gap-1.5">
          {deck.is_tournament && (
            <span className="mt-0.5 inline-flex shrink-0 items-center gap-0.5 rounded bg-amber-500/15 px-1 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300">
              <Trophy className="h-2.5 w-2.5" />
              대회
            </span>
          )}
          <h3 className="line-clamp-2 text-body-md font-bold leading-snug text-ink">{deck.name}</h3>
        </div>

        <div className="mt-1.5 flex items-center gap-1.5 text-[12px] text-ink-soft">
          <span className="flex shrink-0 gap-0.5">
            {deck.domains.map((dm) => (
              <span
                key={dm}
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: DOMAIN[dm]?.color ?? "#888" }}
              />
            ))}
          </span>
          <span className="truncate font-semibold text-ink">{shortLegend(deck.legend_name)}</span>
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] text-ink-soft">
          {deck.author_name && <span className="truncate">{deck.author_name}</span>}
          <span className="inline-flex items-center gap-0.5 text-coral">
            <Heart className="h-3 w-3 fill-coral" />
            {deck.likes}
          </span>
          <span className="inline-flex items-center gap-0.5">
            <Layers className="h-3 w-3" />
            {deck.card_count}
          </span>
        </div>

        <div className="mt-2.5 flex items-center gap-1.5">
          <Link
            href={`/deck-simulator?d=${encodeURIComponent(deck.deck_code)}`}
            className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-primary px-3 py-2 text-label-sm font-bold text-white transition hover:bg-primary-container"
          >
            시뮬레이터로 열기 <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <button
            type="button"
            onClick={copy}
            title="덱 코드 복사"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-line text-ink-soft transition hover:border-primary/40 hover:text-ink"
          >
            {copied ? <Check className="h-4 w-4 text-emerald" /> : <Copy className="h-4 w-4" />}
          </button>
          {deck.source_url && (
            <Link
              href={deck.source_url}
              target="_blank"
              rel="noopener noreferrer"
              title="원본 (Piltover Archive)"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-line text-ink-soft transition hover:border-primary/40 hover:text-ink"
            >
              <ExternalLink className="h-4 w-4" />
            </Link>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              disabled={deleting}
              title="메타 덱 삭제 (운영진)"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-line text-ink-soft transition hover:border-error/50 hover:bg-error/10 hover:text-error disabled:opacity-40"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
