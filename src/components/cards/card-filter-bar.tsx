"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { X, SlidersHorizontal } from "lucide-react";

import { CARD_DOMAINS, CARD_RARITIES, CARD_SETS, CARD_TYPES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const LABELS: Record<string, Record<string, string>> = {
  domain: Object.fromEntries(CARD_DOMAINS.map((d) => [d.slug, d.label])),
  type: Object.fromEntries(CARD_TYPES.map((t) => [t.slug, t.label])),
  setCode: Object.fromEntries(CARD_SETS.map((s) => [s.code, s.code])),
  rarity: Object.fromEntries(CARD_RARITIES.map((r) => [r.slug, r.label])),
};
const KEY_LABEL: Record<string, string> = {
  domain: "도메인",
  type: "유형",
  setCode: "확장팩",
  rarity: "레어도",
};

/**
 * 카드 검색 필터 — 도메인 색칩 / 유형·확장팩·레어도 필터.
 * 선택하면 URL 쿼리스트링 갱신(page 리셋). 서버 컴포넌트가 읽어 필터링.
 */
export function CardFilterBar() {
  const router = useRouter();
  const params = useSearchParams();

  const push = (next: URLSearchParams) => {
    next.delete("page");
    const qs = next.toString();
    router.push(qs ? `/cards?${qs}` : "/cards", { scroll: false });
  };

  const toggle = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (next.get(key) === value) next.delete(key);
    else next.set(key, value);
    push(next);
  };

  const clearOne = (key: string) => {
    const next = new URLSearchParams(params.toString());
    next.delete(key);
    push(next);
  };

  const clearAll = () => {
    const next = new URLSearchParams();
    const q = params.get("q");
    if (q) next.set("q", q);
    push(next);
  };

  const active = (key: string, value: string) => params.get(key) === value;
  const activeKeys = ["domain", "type", "setCode", "rarity", "cost"].filter((k) => params.get(k));

  return (
    <div className="rounded-2xl border border-line/70 bg-card p-3">
      {/* 활성 필터 요약 */}
      {activeKeys.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-1.5 border-b border-line/50 pb-3">
          <SlidersHorizontal className="h-3.5 w-3.5 text-ink-soft" />
          {activeKeys.map((k) => {
            const v = params.get(k)!;
            const label =
              k === "cost" ? `${v}코스트` : (LABELS[k]?.[v] ?? v);
            return (
              <button
                key={k}
                type="button"
                onClick={() => clearOne(k)}
                className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-label-sm font-bold text-primary-strong hover:bg-primary/20"
              >
                {KEY_LABEL[k] ?? k}: {label}
                <X className="h-3 w-3" />
              </button>
            );
          })}
          <button
            type="button"
            onClick={clearAll}
            className="text-label-sm font-bold text-ink-soft hover:text-error"
          >
            전체 해제
          </button>
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        {/* 도메인 — 색칩 */}
        <Row label="도메인">
          {CARD_DOMAINS.map((d) => (
            <button
              key={d.slug}
              type="button"
              onClick={() => toggle("domain", d.slug)}
              aria-pressed={active("domain", d.slug)}
              title={d.label}
              className={cn(
                "group relative grid h-7 w-7 place-items-center rounded-full transition",
                active("domain", d.slug)
                  ? "ring-2 ring-primary ring-offset-2 ring-offset-card"
                  : "opacity-70 hover:opacity-100",
              )}
            >
              <span
                className="h-5 w-5 rounded-full ring-1 ring-black/10"
                style={{ backgroundColor: d.color }}
              />
            </button>
          ))}
        </Row>

        <Row label="유형">
          {CARD_TYPES.map((t) => (
            <Chip key={t.slug} on={active("type", t.slug)} onClick={() => toggle("type", t.slug)}>
              {t.label}
            </Chip>
          ))}
        </Row>

        <Row label="확장팩">
          {CARD_SETS.map((s) => (
            <Chip
              key={s.code}
              on={active("setCode", s.code)}
              onClick={() => toggle("setCode", s.code)}
              title={s.name}
            >
              <span className="font-mono text-[11px] font-extrabold">{s.code}</span>
              <span className="hidden sm:inline">{s.label}</span>
            </Chip>
          ))}
        </Row>

        <Row label="레어도">
          {CARD_RARITIES.map((r) => (
            <Chip key={r.slug} on={active("rarity", r.slug)} onClick={() => toggle("rarity", r.slug)}>
              {r.label}
            </Chip>
          ))}
        </Row>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-11 shrink-0 text-label-sm font-bold text-ink-soft">{label}</span>
      <div className="flex flex-1 flex-wrap items-center gap-1.5">{children}</div>
    </div>
  );
}

function Chip({
  on,
  onClick,
  title,
  children,
}: {
  on: boolean;
  onClick: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-pressed={on}
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-body-sm font-semibold transition",
        on
          ? "bg-primary text-white shadow-sm"
          : "bg-subcanvas text-ink-soft hover:bg-subcanvas/70 hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}
