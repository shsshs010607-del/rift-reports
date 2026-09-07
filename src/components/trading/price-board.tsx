"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, ArrowUpDown } from "lucide-react";
import type { PriceRow } from "@/lib/prices";
import { PRINT_LANGUAGES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const langLabel = (s: string) =>
  PRINT_LANGUAGES.find((l) => l.slug === s)?.label ?? s.toUpperCase();

const money = (n: number | null | undefined) =>
  n == null ? "—" : `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const pct = (n: number | null | undefined) =>
  n == null ? "" : `${n > 0 ? "+" : ""}${n.toFixed(1)}%`;

type SortKey = "price" | "change" | "name";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "price", label: "시세" },
  { key: "change", label: "7일 변동" },
  { key: "name", label: "이름" },
];

/**
 * 카드 거래 페이지 시세표 — JustTCG 대표 시세를 검색·세트·정렬해서 보여준다.
 * 행을 누르면 /trading/cards/[printId] 상세(상태별 시세·추이·거래 링크)로 이동.
 */
export function PriceBoard({ rows }: { rows: PriceRow[] }) {
  const [q, setQ] = useState("");
  const [set, setSet] = useState("");
  const [sort, setSort] = useState<SortKey>("price");
  const [asc, setAsc] = useState(false);

  const sets = useMemo(() => {
    const s = new Set<string>();
    for (const r of rows) if (r.print?.set_code) s.add(r.print.set_code);
    return [...s].sort();
  }, [rows]);

  const view = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const filtered = rows.filter((r) => {
      if (set && r.print?.set_code !== set) return false;
      if (!needle) return true;
      return (
        r.print?.name.toLowerCase().includes(needle) ||
        r.print?.name_en?.toLowerCase().includes(needle) ||
        r.print?.number?.toLowerCase().includes(needle)
      );
    });
    const dir = asc ? 1 : -1;
    return [...filtered].sort((a, b) => {
      if (sort === "name") return dir * (a.print?.name ?? "").localeCompare(b.print?.name ?? "", "ko");
      if (sort === "change") return dir * ((a.change_7d ?? 0) - (b.change_7d ?? 0));
      return dir * ((a.market_price ?? 0) - (b.market_price ?? 0));
    });
  }, [rows, q, set, sort, asc]);

  if (rows.length === 0) {
    return (
      <p className="rounded-2xl border border-line bg-card p-8 text-center text-body-md text-ink-soft">
        아직 시세 데이터가 없습니다. 잠시 후 다시 확인해 주세요.
      </p>
    );
  }

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
            className="field pl-9"
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
        </div>
      </div>

      {/* 정렬 */}
      <div className="flex items-center gap-1 text-label-sm">
        <span className="text-ink-soft">정렬</span>
        {SORTS.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => (sort === s.key ? setAsc((v) => !v) : (setSort(s.key), setAsc(false)))}
            className={cn(
              "inline-flex items-center gap-1 rounded-lg px-2 py-1 font-semibold transition",
              sort === s.key
                ? "bg-primary text-white"
                : "text-ink-soft hover:bg-subcanvas hover:text-ink",
            )}
          >
            {s.label}
            {sort === s.key && <ArrowUpDown className="h-3 w-3" />}
          </button>
        ))}
        <span className="ml-auto text-ink-soft">{view.length.toLocaleString("ko-KR")}장</span>
      </div>

      {/* 표 */}
      <ul className="divide-y divide-line/70 overflow-hidden rounded-2xl border border-line/80 bg-card">
        {view.map((r) => {
          const up = (r.change_7d ?? 0) >= 0;
          return (
            <li key={r.id}>
              <Link
                href={`/trading/cards/${r.print_id}`}
                className="flex items-center gap-3 p-3 transition hover:bg-subcanvas/50"
              >
                <span className="relative h-12 w-9 shrink-0 overflow-hidden rounded bg-subcanvas">
                  {r.print?.image_url && (
                    <Image
                      src={r.print.image_url}
                      alt=""
                      fill
                      sizes="36px"
                      className="object-cover"
                    />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-body-md text-ink">{r.print?.name ?? "—"}</span>
                  <span className="block truncate text-body-sm text-ink-soft">
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
                  <span className="block text-body-md font-semibold text-ink">
                    {money(r.market_price)}
                  </span>
                  {r.change_7d != null && (
                    <span
                      className={cn(
                        "block text-body-sm font-semibold",
                        up ? "text-emerald" : "text-coral",
                      )}
                    >
                      {pct(r.change_7d)}
                    </span>
                  )}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
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
