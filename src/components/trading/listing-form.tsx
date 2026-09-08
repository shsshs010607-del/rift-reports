"use client";

import { useEffect, useMemo, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Layers, Search, ChevronDown } from "lucide-react";

import { createListing, type TradeActionState } from "@/lib/actions/trading";
import { TRADING_CATEGORIES, TRADE_CONDITIONS, KR_SIDO } from "@/lib/constants";
import type { Card } from "@/lib/types/card";
import { resolveCardText, cardNumber } from "@/lib/types/card";
import { cn } from "@/lib/utils";

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-label-md font-bold text-ink">{label}</span>
      {children}
      {error && <span className="text-body-sm text-coral">{error}</span>}
    </label>
  );
}

export function ListingForm() {
  const [state, formAction] = useFormState<TradeActionState, FormData>(createListing, {});
  const fe = state.fieldErrors ?? {};
  const [title, setTitle] = useState("");

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Field label="거래 유형" error={fe.category}>
        <div className="flex gap-2">
          {TRADING_CATEGORIES.map((c, i) => (
            <label
              key={c.slug}
              className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-line bg-card px-3 py-2 text-label-md font-bold text-ink-soft has-[:checked]:border-primary has-[:checked]:bg-primary/10 has-[:checked]:text-primary-strong"
            >
              <input
                type="radio"
                name="category"
                value={c.slug}
                defaultChecked={i === 0}
                className="sr-only"
              />
              {c.label}
            </label>
          ))}
        </div>
      </Field>

      <CollectionPicker onPick={(name) => setTitle((t) => t || `${name} `)} />

      <Field label="제목" error={fe.title}>
        <input
          name="title"
          required
          maxLength={120}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="예) 아리(오버넘버) 프로모 팝니다"
          className="field"
        />
      </Field>

      <Field label="설명 · 연락 방법" error={fe.description}>
        <textarea
          name="description"
          rows={6}
          maxLength={4000}
          placeholder={
            "카드 상태, 수량, 거래 방식(택배/직거래), 연락처(디스코드·오픈채팅 링크 등)를 적어주세요.\n\n※ 연락처를 남기지 않으면 거래가 어렵습니다."
          }
          className="field"
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="카드 상태" error={fe.card_condition}>
          <select name="card_condition" className="field" defaultValue="">
            <option value="">선택 안 함</option>
            {TRADE_CONDITIONS.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="지역" error={fe.region}>
          <select name="region" className="field" defaultValue="">
            <option value="">전국 / 온라인</option>
            {KR_SIDO.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="가격 (원)" error={fe.price}>
          <input
            name="price"
            type="number"
            min={0}
            step={100}
            placeholder="비워두면 '가격 협의'"
            className="field"
          />
        </Field>
        <label className="flex items-center gap-2 self-end pb-2.5 text-body-md text-ink">
          <input type="checkbox" name="is_negotiable" className="h-4 w-4" />
          가격 협의 가능
        </label>
      </div>

      {state.error && !state.fieldErrors && (
        <p className="text-body-sm text-coral">{state.error}</p>
      )}

      <Submit />
      <p className="text-body-sm text-ink-soft">
        거래 사기·허위 매물 작성 시 게시물이 삭제되고 이용이 제한될 수 있습니다.
      </p>
    </form>
  );
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary w-full">
      {pending ? "등록 중…" : "거래글 등록"}
    </button>
  );
}

/** 내 컬렉션에서 카드를 골라 제목에 채운다. 컬렉션이 비어 있으면 렌더 안 함. */
function CollectionPicker({ onPick }: { onPick: (name: string) => void }) {
  const [collection, setCollection] = useState<Record<string, number>>({});
  const [all, setAll] = useState<Card[]>([]);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    fetch("/api/collection")
      .then((r) => (r.ok ? r.json() : {}))
      .then((m: Record<string, number>) => setCollection(m ?? {}))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!open || all.length) return;
    fetch("/api/cards?limit=1000")
      .then((r) => (r.ok ? r.json() : { cards: [] }))
      .then((d: { cards: Card[] }) => setAll(d.cards ?? []))
      .catch(() => {});
  }, [open, all.length]);

  const owned = useMemo(() => {
    const term = q.trim().toLowerCase();
    return all
      .filter((c) => (collection[c.id] ?? 0) > 0)
      .filter((c) =>
        !term
          ? true
          : c.name.toLowerCase().includes(term) ||
            c.localization.en.name.toLowerCase().includes(term) ||
            (cardNumber(c) ?? "").toLowerCase().includes(term),
      )
      .sort((a, b) => a.name.localeCompare(b.name, "ko"))
      .slice(0, 30);
  }, [all, collection, q]);

  if (Object.keys(collection).length === 0) return null;

  return (
    <div className="rounded-xl border border-line/70 bg-subcanvas/40 p-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-1.5 text-label-md font-bold text-ink-soft transition hover:text-ink"
      >
        <Layers className="h-4 w-4 text-primary" />
        내 컬렉션에서 카드 고르기
        <ChevronDown className={cn("ml-auto h-4 w-4 transition", open && "rotate-180")} />
      </button>

      {open && (
        <div className="mt-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="보유 카드 검색"
              className="w-full rounded-lg border border-line bg-card py-2 pl-9 pr-3 text-body-sm text-ink focus:border-primary focus:outline-none"
            />
          </div>
          <ul className="mt-2 flex max-h-56 flex-col divide-y divide-line/40 overflow-y-auto">
            {owned.length === 0 ? (
              <li className="py-3 text-center text-body-sm text-ink-soft">
                {all.length ? "보유 카드가 없습니다." : "불러오는 중…"}
              </li>
            ) : (
              owned.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onPick(resolveCardText(c, "ko").name);
                      setOpen(false);
                    }}
                    className="flex w-full items-center gap-2 py-2 text-left hover:text-primary-strong"
                  >
                    <span className="min-w-0 flex-1 truncate text-body-sm text-ink">
                      {resolveCardText(c, "ko").name}
                    </span>
                    <span className="shrink-0 text-label-sm text-ink-soft">
                      보유 {collection[c.id]}
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
