"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search, Info, ExternalLink } from "lucide-react";
import {
  GLOSSARY,
  GLOSSARY_CATEGORIES,
  glossaryToCardHref,
  type GlossaryCategory,
} from "@/content/glossary";
import { cn } from "@/lib/utils";

function norm(s: string) {
  return s.toLowerCase().replace(/\s+/g, "");
}

export function GlossaryBrowser() {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<GlossaryCategory | "전체">("전체");

  const results = useMemo(() => {
    const q = norm(query);
    return GLOSSARY.filter((t) => {
      if (cat !== "전체" && t.category !== cat) return false;
      if (!q) return true;
      return (
        norm(t.term).includes(q) ||
        norm(t.en).includes(q) ||
        norm(t.symbol ?? "").includes(q) ||
        norm(t.definition).includes(q)
      );
    }).sort((a, b) => a.term.localeCompare(b.term, "ko"));
  }, [query, cat]);

  return (
    <div>
      <p className="mb-4 flex items-start gap-2 text-body-sm text-ink-soft">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        한글명은 임시 번역이고 영문명이 정식 명칭입니다. 공식 한글판이 나오면 교체됩니다.
      </p>

      <div className="sticky top-16 z-10 -mx-1 bg-canvas/90 px-1 py-3 backdrop-blur">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="용어 검색 — 한글·영문 모두 (예: 파워 / Power / Showdown)"
            className="field pl-10"
          />
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {(["전체", ...GLOSSARY_CATEGORIES] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCat(c)}
              className={cn(
                "rounded-full px-3 py-1 text-body-sm font-semibold transition",
                cat === c ? "bg-primary text-white" : "bg-primary-wash text-primary-strong hover:bg-line",
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <p className="mb-3 mt-1 text-body-sm text-ink-soft">{results.length}개 용어</p>

      <div className="grid gap-3 sm:grid-cols-2">
        {results.map((t) => {
          return (
            <article
              key={t.en}
              id={`term-${t.en}`}
              className="scroll-mt-44 rounded-2xl border border-line/70 bg-card p-4"
            >
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="min-w-0 font-display text-title-md text-ink">
                  {t.term}
                  <span className="ml-1.5 text-body-sm font-normal text-ink-soft">· {t.en}</span>
                  {t.symbol && (
                    <span className="ml-1.5 rounded bg-primary/10 px-1.5 py-0.5 font-mono text-[12px] text-primary-strong">
                      {t.symbol}
                    </span>
                  )}
                </h3>
                <span className="shrink-0 rounded-md bg-subcanvas px-1.5 py-0.5 text-[11px] font-bold text-ink-soft">
                  {t.category}
                </span>
              </div>

              <p className="mt-2 text-body-md text-ink-soft">{t.definition}</p>

              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                {t.related?.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setCat("전체");
                      setQuery(r);
                    }}
                    className="rounded-full bg-subcanvas px-2 py-0.5 text-body-sm text-ink-soft hover:text-primary-strong"
                  >
                    #{r}
                  </button>
                ))}
                {t.cardSearchable && (
                  <Link
                    href={glossaryToCardHref(t)}
                    className="inline-flex items-center gap-1 rounded-full bg-primary-wash px-2 py-0.5 text-body-sm font-semibold text-primary-strong hover:bg-line"
                  >
                    카드에서 찾기
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {results.length === 0 && (
        <div className="grid place-items-center rounded-2xl border-2 border-dashed border-line bg-subcanvas/40 px-6 py-12 text-center">
          <p className="text-body-md text-ink-soft">
            &ldquo;{query}&rdquo; 에 해당하는 용어가 없습니다.
          </p>
        </div>
      )}
    </div>
  );
}
