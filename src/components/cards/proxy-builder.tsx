"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Plus, Minus, Trash2, Printer, X } from "lucide-react";

import type { Card } from "@/lib/types/card";
import { resolveCardText, cardNumber } from "@/lib/types/card";
import { renderProxySheets, type ProxyEntry } from "@/lib/cards/proxy-sheet";
import { LocalizedCard } from "@/components/cards/localized-card";

export function ProxyBuilder() {
  const [all, setAll] = useState<Card[]>([]);
  const [q, setQ] = useState("");
  const [picks, setPicks] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    fetch("/api/cards?limit=1000")
      .then((r) => (r.ok ? r.json() : { cards: [] }))
      .then((d: { cards: Card[] }) => setAll(d.cards ?? []))
      .catch(() => setAll([]));
  }, []);

  const byId = useMemo(() => new Map(all.map((c) => [c.id, c])), [all]);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    return all
      .filter((c) => {
        const ko = resolveCardText(c, "ko");
        return (
          c.name.toLowerCase().includes(term) ||
          c.localization.en.name.toLowerCase().includes(term) ||
          ko.text.toLowerCase().includes(term) ||
          (cardNumber(c) ?? "").toLowerCase().includes(term)
        );
      })
      .slice(0, 20);
  }, [q, all]);

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
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
      {/* 검색 + 결과 */}
      <div>
        <div className="relative">
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

        <div className="mt-4">
          {all.length === 0 ? (
            <p className="py-10 text-center text-body-sm text-ink-soft">카드 불러오는 중…</p>
          ) : !q.trim() ? (
            <p className="py-10 text-center text-body-sm text-ink-soft">
              프록시로 뽑을 카드를 검색해서 담으세요.
            </p>
          ) : results.length === 0 ? (
            <p className="py-10 text-center text-body-sm text-ink-soft">검색 결과가 없습니다.</p>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {results.map((c) => {
                const ko = resolveCardText(c, "ko");
                const qty = picks[c.id] ?? 0;
                return (
                  <li
                    key={c.id}
                    className="flex flex-col overflow-hidden rounded-xl border border-line bg-card"
                  >
                    <LocalizedCard card={c} sizes="180px" className="!rounded-none" />
                    <div className="flex items-center gap-1 p-1.5">
                      <span className="min-w-0 flex-1 truncate text-label-sm font-bold text-ink">
                        {ko.name}
                      </span>
                      {qty > 0 ? (
                        <span className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => bump(c.id, -1)}
                            className="grid h-6 w-6 place-items-center rounded-full bg-subcanvas text-ink-soft"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-4 text-center text-label-md font-black text-primary-strong">
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => bump(c.id, 1)}
                            className="grid h-6 w-6 place-items-center rounded-full bg-primary text-white"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => bump(c.id, 1)}
                          className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary text-white"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
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
          <p className="py-8 text-center text-body-sm text-ink-soft">담은 카드가 없습니다.</p>
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
