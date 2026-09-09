"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Copy, ExternalLink, Trophy } from "lucide-react";

import { CARD_DOMAINS } from "@/lib/constants";
import type { MetaDeck } from "@/lib/meta-decks";
import { cn } from "@/lib/utils";

const DOMAIN_COLOR = Object.fromEntries(CARD_DOMAINS.map((d) => [d.slug, d.color]));

export function MetaDeckBrowser({
  decks,
  images,
}: {
  decks: MetaDeck[];
  images: Record<string, string>;
}) {
  const legends = useMemo(() => {
    const m = new Map<string, number>();
    for (const d of decks) if (d.legend_name) m.set(d.legend_name, (m.get(d.legend_name) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [decks]);

  const [legend, setLegend] = useState<string | null>(null);
  const shown = legend ? decks.filter((d) => d.legend_name === legend) : decks;

  return (
    <div className="mt-4">
      {legends.length > 1 && (
        <div className="-mx-1 mb-4 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Chip on={legend === null} onClick={() => setLegend(null)}>
            전체 {decks.length}
          </Chip>
          {legends.map(([name, n]) => (
            <Chip key={name} on={legend === name} onClick={() => setLegend(name)}>
              {name.split(/[,–-]/)[0].trim()} {n}
            </Chip>
          ))}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((d) => (
          <DeckCard key={d.id} deck={d} img={d.legend_ref ? images[d.legend_ref] : undefined} />
        ))}
      </div>
    </div>
  );
}

function Chip({
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

function DeckCard({ deck, img }: { deck: MetaDeck; img?: string }) {
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
    <div className="flex flex-col overflow-hidden rounded-2xl border border-line/70 bg-card">
      <div className="relative flex gap-3 p-3">
        <span className="relative h-[68px] w-[68px] shrink-0 overflow-hidden rounded-xl bg-subcanvas">
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={img} alt="" loading="lazy" className="h-full w-full object-cover object-top" />
          ) : (
            <span className="grid h-full w-full place-items-center gap-1">
              <span className="flex gap-1">
                {deck.domains.map((dm) => (
                  <span
                    key={dm}
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: DOMAIN_COLOR[dm] ?? "#888" }}
                  />
                ))}
              </span>
            </span>
          )}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-1.5">
            {deck.is_tournament && (
              <Trophy className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
            )}
            <p className="line-clamp-2 text-body-md font-bold leading-snug text-ink">{deck.name}</p>
          </div>
          <p className="mt-1 truncate text-[12px] text-ink-soft">
            {deck.legend_name}
            {deck.author_name ? ` · ${deck.author_name}` : ""}
          </p>
          <div className="mt-1 flex items-center gap-2 text-[12px] text-ink-soft">
            <span className="inline-flex items-center gap-1">
              {deck.domains.map((dm) => (
                <span
                  key={dm}
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: DOMAIN_COLOR[dm] ?? "#888" }}
                />
              ))}
            </span>
            <span className="text-coral">♥ {deck.likes}</span>
            <span>· {deck.card_count}장</span>
          </div>
        </div>
      </div>

      <div className="mt-auto flex items-center gap-1.5 border-t border-line/50 p-2">
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
      </div>
    </div>
  );
}
