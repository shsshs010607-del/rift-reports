"use client";

import { useFormState, useFormStatus } from "react-dom";
import { createListing, type TradeActionState } from "@/lib/actions/trading";
import { TRADING_CATEGORIES, TRADE_CONDITIONS, KR_SIDO } from "@/lib/constants";

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

      <Field label="제목" error={fe.title}>
        <input
          name="title"
          required
          maxLength={120}
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
