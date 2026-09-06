"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";

import { CARD_DOMAINS, CARD_RARITIES, CARD_SETS, CARD_TYPES } from "@/lib/constants";
import { cn } from "@/lib/utils";

/**
 * 카드 검색 필터 바 — 도메인 / 타입 / 확장팩 / 레어도 토글.
 * 선택하면 URL 쿼리스트링을 갱신한다(page 는 1로 리셋). 서버 컴포넌트가 이 값을 읽어 필터링.
 */
export function CardFilterBar() {
  const router = useRouter();
  const params = useSearchParams();

  const toggle = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (next.get(key) === value) next.delete(key);
    else next.set(key, value);
    next.delete("page");
    const qs = next.toString();
    router.push(qs ? `/cards?${qs}` : "/cards", { scroll: false });
  };

  const clearAll = () => {
    const next = new URLSearchParams();
    const q = params.get("q");
    if (q) next.set("q", q);
    const qs = next.toString();
    router.push(qs ? `/cards?${qs}` : "/cards", { scroll: false });
  };

  const active = (key: string, value: string) => params.get(key) === value;
  const hasFilter = ["domain", "type", "setCode", "rarity", "cost"].some((k) => params.get(k));

  return (
    <div className="flex flex-col gap-2">
      <FilterRow label="도메인">
        {CARD_DOMAINS.map((d) => (
          <Chip key={d.slug} on={active("domain", d.slug)} onClick={() => toggle("domain", d.slug)}>
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
            {d.label}
          </Chip>
        ))}
      </FilterRow>

      <FilterRow label="타입">
        {CARD_TYPES.map((t) => (
          <Chip key={t.slug} on={active("type", t.slug)} onClick={() => toggle("type", t.slug)}>
            {t.label}
          </Chip>
        ))}
      </FilterRow>

      <FilterRow label="확장팩">
        {CARD_SETS.map((s) => (
          <Chip
            key={s.code}
            on={active("setCode", s.code)}
            onClick={() => toggle("setCode", s.code)}
            title={s.name}
          >
            <span className="font-mono text-[11px] font-bold">{s.code}</span>
            {s.label}
          </Chip>
        ))}
      </FilterRow>

      <FilterRow label="레어도">
        {CARD_RARITIES.map((r) => (
          <Chip key={r.slug} on={active("rarity", r.slug)} onClick={() => toggle("rarity", r.slug)}>
            {r.label}
          </Chip>
        ))}
        {hasFilter && (
          <button
            type="button"
            onClick={clearAll}
            className="ml-1 inline-flex items-center gap-1 rounded-full border border-line px-2 py-0.5 text-label-sm text-ink-soft hover:text-error"
          >
            <X className="h-3 w-3" />
            필터 초기화
          </button>
        )}
      </FilterRow>
    </div>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      <span className="mr-1 w-12 shrink-0 text-label-sm font-bold text-ink-soft">{label}</span>
      {children}
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
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-body-sm transition",
        on
          ? "border-primary bg-primary/10 font-bold text-primary-strong"
          : "border-line bg-card text-ink-soft hover:border-primary/40",
      )}
    >
      {children}
    </button>
  );
}
