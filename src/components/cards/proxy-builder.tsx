"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Printer,
  X,
  SlidersHorizontal,
  ClipboardPaste,
} from "lucide-react";

import type { Card } from "@/lib/types/card";
import { resolveCardText, cardNumber } from "@/lib/types/card";
import { CARD_DOMAINS, CARD_TYPES } from "@/lib/constants";
import {
  buildDeckRefMaps,
  decodeDeck,
  decodeDeckCode,
  isDeckCode,
} from "@/lib/deck/deck-code";
import type { Deck } from "@/lib/types/deck";
import { renderProxySheets, type ProxyEntry } from "@/lib/cards/proxy-sheet";
import { LocalizedCard } from "@/components/cards/localized-card";
import { cn } from "@/lib/utils";

const COSTS = ["0", "1", "2", "3", "4", "5", "6", "7+"] as const;
const SHOW_STEP = 60;

export function ProxyBuilder() {
  const [all, setAll] = useState<Card[]>([]);
  const [q, setQ] = useState("");
  const [domain, setDomain] = useState("");
  const [type, setType] = useState("");
  const [cost, setCost] = useState("");
  const [setCode, setSetCode] = useState("");
  const [openFilters, setOpenFilters] = useState(false);
  const [limit, setLimit] = useState(SHOW_STEP);
  const [picks, setPicks] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const [deckInput, setDeckInput] = useState("");
  const [importMsg, setImportMsg] = useState("");

  useEffect(() => {
    fetch("/api/cards?limit=2000")
      .then((r) => (r.ok ? r.json() : { cards: [] }))
      .then((d: { cards: Card[] }) => setAll(d.cards ?? []))
      .catch(() => setAll([]));
  }, []);

  const byId = useMemo(() => new Map(all.map((c) => [c.id, c])), [all]);

  const filtersOn = Boolean(q.trim() || domain || type || cost || setCode);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return all
      .filter((c) => {
        if (domain && !(c.domains as readonly string[]).includes(domain)) return false;
        if (type && c.type !== type) return false;
        if (setCode && c.setCode !== setCode) return false;
        if (cost) {
          const n = c.cost ?? -1;
          if (cost === "7+" ? n < 7 : String(n) !== cost) return false;
        }
        if (term) {
          const ko = resolveCardText(c, "ko");
          return (
            c.name.toLowerCase().includes(term) ||
            c.localization.en.name.toLowerCase().includes(term) ||
            ko.text.toLowerCase().includes(term) ||
            (cardNumber(c) ?? "").toLowerCase().includes(term)
          );
        }
        return true;
      })
      .sort(
        (a, b) =>
          a.setCode.localeCompare(b.setCode) ||
          (Number(String(a.collectorNumber).replace(/\D+/g, "")) || 0) -
            (Number(String(b.collectorNumber).replace(/\D+/g, "")) || 0),
      );
  }, [all, q, domain, type, cost, setCode]);

  useEffect(() => setLimit(SHOW_STEP), [q, domain, type, cost, setCode]);
  const shown = filtered.slice(0, limit);

  const entries: ProxyEntry[] = useMemo(
    () =>
      Object.entries(picks)
        .map(([id, qty]) => ({ card: byId.get(id), qty }))
        .filter((e): e is ProxyEntry => Boolean(e.card) && e.qty > 0),
    [picks, byId],
  );
  const totalCards = entries.reduce((s, e) => s + e.qty, 0);
  const pages = Math.ceil(totalCards / 9);

  const bump = (id: string, d: number) =>
    setPicks((p) => {
      const next = Math.max(0, (p[id] ?? 0) + d);
      const copy = { ...p };
      if (next === 0) delete copy[id];
      else copy[id] = Math.min(99, next);
      return copy;
    });

  const clearFilters = () => {
    setQ("");
    setDomain("");
    setType("");
    setCost("");
    setSetCode("");
  };

  /** rr1.* / base64 / 공유 URL 붙여넣기 → 덱의 모든 카드를 담기 목록에 추가 */
  function importDeck() {
    setImportMsg("");
    if (all.length === 0) return setImportMsg("카드 데이터를 불러오는 중입니다.");
    let s = deckInput.trim();
    const urlMatch = s.match(/[?&](?:d|deck)=([^&\s]+)/);
    if (urlMatch) s = decodeURIComponent(urlMatch[1]);
    if (!s) return setImportMsg("덱 코드를 붙여넣으세요.");

    let deck: Deck | null = null;
    if (isDeckCode(s)) {
      const { idByRef } = buildDeckRefMaps(all);
      deck = decodeDeckCode(s, idByRef);
    } else {
      deck = decodeDeck(s);
    }
    if (!deck) return setImportMsg("덱 코드를 해석할 수 없습니다.");

    const add: Record<string, number> = {};
    const inc = (id: string | null | undefined, n = 1) => {
      if (id) add[id] = (add[id] ?? 0) + n;
    };
    inc(deck.legendId);
    inc(deck.championId);
    for (const e of deck.entries) inc(e.id, e.qty);

    const resolved = Object.entries(add).filter(([id]) => byId.has(id));
    if (resolved.length === 0) return setImportMsg("이 덱의 카드를 찾지 못했습니다.");

    setPicks((p) => {
      const copy = { ...p };
      for (const [id, n] of resolved) copy[id] = Math.min(99, (copy[id] ?? 0) + n);
      return copy;
    });
    const total = resolved.reduce((s2, [, n]) => s2 + n, 0);
    const missing = Object.keys(add).length - resolved.length;
    setImportMsg(`${total}장 담았어요${missing ? ` (${missing}종은 데이터 없음)` : ""}.`);
    setDeckInput("");
  }

  async function download() {
    if (entries.length === 0) return;
    setBusy(true);
    setNote("");
    try {
      const blobs = await renderProxySheets(entries, "ko");
      blobs.forEach((blob, i) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `proxy_sheet_${i + 1}.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
      });
      setNote(`${blobs.length}장 저장 완료 · A4 실제 크기로 인쇄하세요`);
    } catch {
      setNote("이미지 생성에 실패했어요.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
      {/* 검색 + 필터 + 카드 그리드 */}
      <div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="카드명 · 효과 · 번호로 검색"
              className="w-full rounded-2xl border-2 border-primary-fixed bg-card py-3 pl-10 pr-10 text-body-md text-ink shadow-e1 placeholder:text-ink-soft/70 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15"
            />
            {q && (
              <button
                type="button"
                onClick={() => setQ("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setImportOpen((v) => !v)}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-2xl border-2 px-3.5 text-label-md font-bold transition",
              importOpen
                ? "border-primary bg-primary/10 text-primary-strong"
                : "border-line bg-card text-ink-soft hover:text-ink",
            )}
          >
            <ClipboardPaste className="h-4 w-4" />
            덱 불러오기
          </button>
          <button
            type="button"
            onClick={() => setOpenFilters((v) => !v)}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-2xl border-2 px-3.5 text-label-md font-bold transition",
              openFilters || (domain || type || cost || setCode)
                ? "border-primary bg-primary/10 text-primary-strong"
                : "border-line bg-card text-ink-soft hover:text-ink",
            )}
          >
            <SlidersHorizontal className="h-4 w-4" />
            필터
          </button>
        </div>

        {importOpen && (
          <div className="mt-3 flex flex-col gap-2 rounded-2xl border border-line bg-card p-3.5">
            <p className="text-label-sm font-bold text-ink">덱 코드 · 공유 URL 붙여넣기</p>
            <textarea
              value={deckInput}
              onChange={(e) => setDeckInput(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") importDeck();
              }}
              rows={2}
              placeholder="rr1.… 또는 ?d= / ?deck= 링크 (덱 시뮬레이터 → 덱 코드)"
              className="w-full resize-y rounded-xl border border-line bg-subcanvas/50 px-3 py-2 font-mono text-[13px] text-ink placeholder:text-ink-soft/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={importDeck}
                disabled={!deckInput.trim()}
                className="rounded-full bg-primary px-4 py-2 text-label-sm font-bold text-white transition hover:bg-primary-container disabled:opacity-50"
              >
                덱 카드 담기
              </button>
              {importMsg && <span className="text-label-sm text-ink-soft">{importMsg}</span>}
            </div>
            <p className="text-[12px] text-ink-soft/70">
              덱의 레전드·챔피언·메인덱·전장·룬을 전부 담습니다. 필요 없는 카드는 아래 목록에서 빼면 돼요.
            </p>
          </div>
        )}

        {openFilters && (
          <div className="mt-3 flex flex-col gap-3 rounded-2xl border border-line bg-card p-3.5">
            <FilterRow label="도메인">
              {CARD_DOMAINS.map((d) => (
                <Swatch
                  key={d.slug}
                  on={domain === d.slug}
                  color={d.color}
                  label={d.label}
                  onClick={() => setDomain(domain === d.slug ? "" : d.slug)}
                />
              ))}
            </FilterRow>
            <FilterRow label="유형">
              {CARD_TYPES.filter((t) => t.slug !== "legend").map((t) => (
                <Pill
                  key={t.slug}
                  on={type === t.slug}
                  onClick={() => setType(type === t.slug ? "" : t.slug)}
                >
                  {t.label}
                </Pill>
              ))}
            </FilterRow>
            <FilterRow label="코스트">
              {COSTS.map((c) => (
                <Pill key={c} on={cost === c} onClick={() => setCost(cost === c ? "" : c)}>
                  {c}
                </Pill>
              ))}
            </FilterRow>
            <FilterRow label="확장팩">
              {["OGN", "OGS"].map((s) => (
                <Pill key={s} on={setCode === s} onClick={() => setSetCode(setCode === s ? "" : s)}>
                  {s}
                </Pill>
              ))}
            </FilterRow>
          </div>
        )}

        <div className="mt-3 flex items-center justify-between text-label-sm text-ink-soft">
          <span>
            {all.length === 0 ? "카드 불러오는 중…" : `${filtered.length.toLocaleString()}장`}
          </span>
          {filtersOn && (
            <button
              type="button"
              onClick={clearFilters}
              className="font-bold text-ink-soft hover:text-error"
            >
              필터 해제
            </button>
          )}
        </div>

        {all.length > 0 && filtered.length === 0 ? (
          <p className="py-14 text-center text-body-sm text-ink-soft">조건에 맞는 카드가 없습니다.</p>
        ) : (
          <>
            <ul className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
              {shown.map((c) => {
                const qty = picks[c.id] ?? 0;
                return (
                  <li key={c.id} className="overflow-hidden rounded-xl border border-line bg-card">
                    <button
                      type="button"
                      onClick={() => bump(c.id, 1)}
                      className="group relative block w-full"
                      title={`${resolveCardText(c, "ko").name} 담기`}
                    >
                      <LocalizedCard card={c} sizes="150px" className="!rounded-none" />
                      {qty > 0 && (
                        <span className="absolute right-1 top-1 grid h-6 min-w-6 place-items-center rounded-full bg-primary px-1 text-label-sm font-black text-white shadow">
                          {qty}
                        </span>
                      )}
                      <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-primary/90 py-1 text-label-sm font-bold text-white opacity-0 transition group-hover:opacity-100">
                        <Plus className="h-3 w-3" /> 담기
                      </span>
                    </button>
                    {qty > 0 && (
                      <div className="flex items-center justify-between px-1.5 py-1">
                        <button
                          type="button"
                          onClick={() => bump(c.id, -1)}
                          className="grid h-6 w-6 place-items-center rounded-full bg-subcanvas text-ink-soft"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="text-label-md font-black text-primary-strong">{qty}</span>
                        <button
                          type="button"
                          onClick={() => bump(c.id, 1)}
                          className="grid h-6 w-6 place-items-center rounded-full bg-primary text-white"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
            {filtered.length > limit && (
              <button
                type="button"
                onClick={() => setLimit((n) => n + SHOW_STEP)}
                className="mt-4 w-full rounded-full border border-line py-2.5 text-label-md font-bold text-ink-soft transition hover:border-primary/40 hover:text-ink"
              >
                더 보기 ({filtered.length - limit}장 남음)
              </button>
            )}
          </>
        )}
      </div>

      {/* 담은 목록 */}
      <div className="note-card p-4 pr-6 lg:sticky lg:top-[128px]">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-label-lg font-bold text-ink">담은 카드</h2>
          <span className="text-label-sm text-ink-soft">
            {totalCards}장 · {pages || 0}페이지
          </span>
        </div>

        {entries.length === 0 ? (
          <p className="py-8 text-center text-body-sm text-ink-soft">
            카드를 눌러 담으세요.
          </p>
        ) : (
          <ul className="flex max-h-[50vh] flex-col divide-y divide-line/40 overflow-y-auto">
            {entries.map((e) => (
              <li key={e.card.id} className="flex items-center gap-2 py-2">
                <span className="min-w-0 flex-1 truncate text-body-sm text-ink">
                  {resolveCardText(e.card, "ko").name}
                </span>
                <span className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => bump(e.card.id, -1)}
                    className="grid h-6 w-6 place-items-center rounded-full bg-subcanvas text-ink-soft"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-4 text-center text-label-md font-black text-ink">{e.qty}</span>
                  <button
                    type="button"
                    onClick={() => bump(e.card.id, 1)}
                    className="grid h-6 w-6 place-items-center rounded-full bg-subcanvas text-ink-soft"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => bump(e.card.id, -99)}
                    className="ml-1 text-ink-soft hover:text-error"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}

        <button
          type="button"
          onClick={download}
          disabled={busy || entries.length === 0}
          className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-2.5 text-label-md font-bold text-white transition hover:bg-primary-container disabled:opacity-50"
        >
          <Printer className="h-4 w-4" />
          {busy ? "만드는 중…" : "인쇄 시트 저장 (PNG)"}
        </button>
        {note && <p className="mt-2 text-center text-label-sm text-ink-soft">{note}</p>}
        <p className="mt-2 text-label-sm text-ink-soft/70">
          A4 · 63×88mm · 페이지당 9장 · 컷 가이드 포함. 실제 크기(100%)로 인쇄하세요.
        </p>
      </div>
    </div>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="w-12 shrink-0 text-label-sm font-bold text-ink-soft">{label}</span>
      {children}
    </div>
  );
}

function Pill({
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
        "rounded-full px-3 py-1 text-label-sm font-bold transition",
        on ? "bg-primary text-white" : "bg-subcanvas text-ink-soft hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}

function Swatch({
  on,
  color,
  label,
  onClick,
}: {
  on: boolean;
  color: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-label-sm font-bold transition",
        on ? "bg-primary text-white" : "bg-subcanvas text-ink-soft hover:text-ink",
      )}
    >
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </button>
  );
}
