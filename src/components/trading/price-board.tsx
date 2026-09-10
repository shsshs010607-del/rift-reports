"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from "lucide-react";
import type { PriceRow } from "@/lib/prices";
import type { FxRate } from "@/lib/fx";
import { PRINT_LANGUAGES } from "@/lib/constants";
import { deltaUsd, fmtKrw, fmtKrwSigned, fmtUsd } from "@/lib/money";
import { cn } from "@/lib/utils";

const langLabel = (s: string) =>
  PRINT_LANGUAGES.find((l) => l.slug === s)?.label ?? s.toUpperCase();

const pct = (n: number | null | undefined) =>
  n == null ? "" : `${n > 0 ? "+" : ""}${n.toFixed(1)}%`;

type SortKey = "price" | "change" | "changePct";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "price", label: "시세" },
  { key: "change", label: "7일 변동액" },
  { key: "changePct", label: "7일 변동%" },
];

const PER_PAGE = 10;

// 기본 목록에서 접어두는 카드 = 세트 장수를 넘는 순수 중복 수집번호(overnumbered, 예: "303/298").
// 시그니처("303 star /298")·쇼케이스·알트아트는 거래 대상이라 포함한다.
const OVERNUMBERED_RE = /overnumbered|오버넘버/i;
function isSpecial(r: PriceRow): boolean {
  const number = r.print?.number ?? "";
  if (OVERNUMBERED_RE.test(r.print?.rarity ?? "") || OVERNUMBERED_RE.test(r.print?.art_variant ?? "")) {
    return true;
  }
  const m = /^\s*(\d+)\s*\/\s*(\d+)/.exec(number);
  return m ? Number(m[1]) > Number(m[2]) && !number.includes("*") : false;
}

/**
 * 카드 시세표 — 검색·세트·정렬 + 페이지네이션.
 * 행을 누르면 /trading/cards/[printId] 상세로 이동.
 */
export function PriceBoard({ rows, fx }: { rows: PriceRow[]; fx: FxRate }) {
  const [q, setQ] = useState("");
  const [set, setSet] = useState("");
  const [sort, setSort] = useState<SortKey>("price");
  const [asc, setAsc] = useState(false);
  const [showSpecial, setShowSpecial] = useState(false);
  const [page, setPage] = useState(1);

  const sets = useMemo(() => {
    const s = new Set<string>();
    for (const r of rows) if (r.print?.set_code) s.add(r.print.set_code);
    return [...s].sort();
  }, [rows]);

  const view = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const filtered = rows.filter((r) => {
      if (set && r.print?.set_code !== set) return false;
      if (!showSpecial && !needle && isSpecial(r)) return false;
      if (!needle) return true;
      return (
        r.print?.ko_name?.toLowerCase().includes(needle) ||
        r.print?.name.toLowerCase().includes(needle) ||
        r.print?.name_en?.toLowerCase().includes(needle) ||
        r.print?.number?.toLowerCase().includes(needle)
      );
    });
    const dir = asc ? 1 : -1;
    const num = (v: number | null | undefined) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : 0;
    };
    const delta = (r: PriceRow) => {
      const mp = num(r.market_price);
      const p = num(r.change_7d);
      if (!mp || !p || p <= -100) return 0; // -100% 이하 → 0 나눗셈 방지
      return deltaUsd(mp, p);
    };
    const primary = (a: PriceRow, b: PriceRow) => {
      if (sort === "change") return delta(a) - delta(b);
      if (sort === "changePct") return num(a.change_7d) - num(b.change_7d);
      return num(a.market_price) - num(b.market_price);
    };
    // 동점(같은 값)은 방향과 무관하게 이름→id 순으로 고정 — 목록이 매번 뒤바뀌지 않도록.
    const key = (r: PriceRow) => r.print?.ko_name || r.print?.name || "";
    return [...filtered].sort((a, b) => {
      const p = primary(a, b);
      if (p !== 0 && Number.isFinite(p)) return dir * p;
      return key(a).localeCompare(key(b), "ko") || a.id.localeCompare(b.id);
    });
  }, [rows, q, set, sort, asc, showSpecial]);

  // 조건이 바뀌면 1페이지로
  useEffect(() => setPage(1), [q, set, sort, asc, showSpecial]);

  if (rows.length === 0) {
    return (
      <p className="rounded-2xl border border-line/70 bg-card p-8 text-center text-body-md text-ink-soft">
        아직 시세 데이터가 없습니다. 잠시 후 다시 확인해 주세요.
      </p>
    );
  }

  const pages = Math.max(1, Math.ceil(view.length / PER_PAGE));
  const cur = Math.min(page, pages);
  const shown = view.slice((cur - 1) * PER_PAGE, cur * PER_PAGE);

  return (
    <div className="flex flex-col gap-3">
      {/* 검색 + 세트 필터 */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="카드명 · 수집번호 검색"
            className="w-full rounded-full border border-line bg-card py-2 pl-9 pr-4 text-body-md text-ink placeholder:text-ink-soft/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          <FilterChip on={set === ""} onClick={() => setSet("")}>
            전체
          </FilterChip>
          {sets.map((s) => (
            <FilterChip key={s} on={set === s} onClick={() => setSet(set === s ? "" : s)}>
              {s}
            </FilterChip>
          ))}
          <FilterChip on={showSpecial} onClick={() => setShowSpecial((v) => !v)}>
            중복번호 포함
          </FilterChip>
        </div>
      </div>

      {/* 정렬 */}
      <div className="flex flex-wrap items-center gap-1 text-label-sm">
        <span className="text-ink-soft">정렬</span>
        {SORTS.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setSort(s.key)}
            className={cn(
              "inline-flex items-center gap-1 rounded-lg px-2 py-1 font-semibold transition",
              sort === s.key
                ? "bg-primary text-white"
                : "text-ink-soft hover:bg-subcanvas hover:text-ink",
            )}
          >
            {s.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setAsc((v) => !v)}
          aria-label={asc ? "오름차순" : "내림차순"}
          className="inline-flex items-center gap-1 rounded-lg border border-line px-2 py-1 font-semibold text-ink-soft transition hover:bg-subcanvas hover:text-ink"
        >
          {asc ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />}
          {asc ? "오름차순" : "내림차순"}
        </button>
        <span className="ml-auto text-ink-soft">{view.length.toLocaleString("ko-KR")}장</span>
      </div>

      {/* 표 */}
      {shown.length === 0 ? (
        <p className="rounded-2xl border border-line/70 bg-card p-8 text-center text-body-sm text-ink-soft">
          조건에 맞는 카드가 없습니다.
        </p>
      ) : (
        <ul className="divide-y divide-line/50 overflow-hidden rounded-2xl border border-line/70 bg-card">
          {shown.map((r) => {
            const up = (r.change_7d ?? 0) >= 0;
            return (
              <li key={r.id}>
                <Link
                  href={`/trading/cards/${r.print_id}`}
                  className="flex items-center gap-3 p-3 transition-colors hover:bg-subcanvas/50"
                >
                  <span className="relative h-12 w-9 shrink-0 overflow-hidden rounded bg-subcanvas">
                    {r.print?.image_url && (
                      <Image src={r.print.image_url} alt="" fill sizes="36px" className="object-cover" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-body-md font-medium text-ink">
                      {r.print?.ko_name || r.print?.name || "—"}
                    </span>
                    <span className="block truncate text-[13px] text-ink-soft">
                      {[
                        r.print && langLabel(r.print.language),
                        r.print?.rarity,
                        r.print?.set_code && `${r.print.set_code} ${r.print.number ?? ""}`.trim(),
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-body-md font-bold text-ink">
                      {fmtKrw(r.market_price, fx.usdKrw)}
                    </span>
                    <span className="block text-[12px] text-ink-soft">{fmtUsd(r.market_price)}</span>
                    {r.market_price != null && r.change_7d != null && r.change_7d !== 0 && (
                      <span
                        className={cn(
                          "block text-label-sm font-semibold",
                          up ? "text-emerald" : "text-coral",
                        )}
                      >
                        {fmtKrwSigned(deltaUsd(r.market_price, r.change_7d), fx.usdKrw)}
                        <span className="text-ink-soft/80"> ({pct(r.change_7d)})</span>
                      </span>
                    )}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-center gap-1 pt-1">
          <button
            type="button"
            onClick={() => setPage(cur - 1)}
            disabled={cur === 1}
            className="grid h-8 w-8 place-items-center rounded-lg text-ink-soft transition hover:bg-subcanvas disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {pageNums(cur, pages).map((n, i) =>
            n === "…" ? (
              <span key={`e${i}`} className="px-1 text-label-sm text-ink-soft">
                …
              </span>
            ) : (
              <button
                key={n}
                type="button"
                onClick={() => setPage(n)}
                className={cn(
                  "grid h-8 min-w-8 place-items-center rounded-lg px-2 text-body-sm font-semibold transition",
                  n === cur ? "bg-primary text-white" : "text-ink-soft hover:bg-subcanvas hover:text-ink",
                )}
              >
                {n}
              </button>
            ),
          )}
          <button
            type="button"
            onClick={() => setPage(cur + 1)}
            disabled={cur === pages}
            className="grid h-8 w-8 place-items-center rounded-lg text-ink-soft transition hover:bg-subcanvas disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

/** 1 … 4 5 [6] 7 8 … 40 형태 페이지 번호 */
function pageNums(cur: number, pages: number): (number | "…")[] {
  const out: (number | "…")[] = [];
  const add = (n: number) => out.push(n);
  const lo = Math.max(2, cur - 1);
  const hi = Math.min(pages - 1, cur + 1);
  add(1);
  if (lo > 2) out.push("…");
  for (let n = lo; n <= hi; n++) add(n);
  if (hi < pages - 1) out.push("…");
  if (pages > 1) add(pages);
  return out;
}

function FilterChip({
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
        "rounded-full border px-2.5 py-1 text-label-sm transition",
        on
          ? "border-primary bg-primary/10 font-bold text-primary-strong"
          : "border-line text-ink-soft hover:border-primary/40",
      )}
    >
      {children}
    </button>
  );
}
