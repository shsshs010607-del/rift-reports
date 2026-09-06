"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { GLOSSARY, GLOSSARY_CATEGORIES, type GlossaryCategory } from "@/content/glossary";
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
        norm(t.reading ?? "").includes(q) ||
        norm(t.definition).includes(q)
      );
    }).sort((a, b) => a.term.localeCompare(b.term, "ko"));
  }, [query, cat]);

  return (
    <div>
      <div className="sticky top-16 z-10 -mx-1 bg-canvas/90 px-1 py-3 backdrop-blur">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="용어 검색 (예: 파워, Showdown, 점령)"
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
        {results.map((t) => (
          <article key={t.term} id={`term-${t.term}`} className="surface scroll-mt-40 p-4">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="font-display text-title-md text-ink">{t.term}</h3>
              <span className="chip shrink-0">{t.category}</span>
            </div>
            {t.reading && <p className="text-body-sm text-ink-soft">{t.reading}</p>}
            <p className="mt-2 text-body-md text-ink-soft">{t.definition}</p>
            {t.related && t.related.length > 0 && (
              <p className="mt-2.5 flex flex-wrap gap-1.5">
                {t.related.map((r) => (
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
              </p>
            )}
          </article>
        ))}
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
