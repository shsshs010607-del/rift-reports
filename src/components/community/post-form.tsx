"use client";

import { useFormState, useFormStatus } from "react-dom";
import { createPost, type ActionState } from "@/lib/actions/community";
import { COMMUNITY_CATEGORIES } from "@/lib/constants";

const initial: ActionState = {};

const INPUT =
  "w-full rounded-xl border border-line bg-card px-3.5 py-2.5 text-body-md text-ink placeholder:text-ink-soft/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15";

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-primary px-6 py-2.5 text-label-md font-bold text-white transition hover:bg-primary-container disabled:opacity-50"
    >
      {pending ? "등록 중…" : "등록"}
    </button>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="mb-1.5 block text-label-md font-bold text-ink">{children}</label>;
}

export function PostForm({
  defaultCategory,
  canWriteNotice,
}: {
  defaultCategory?: string;
  canWriteNotice: boolean;
}) {
  const [state, formAction] = useFormState(createPost, initial);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <Label>게시판</Label>
        <select
          name="category"
          defaultValue={defaultCategory ?? COMMUNITY_CATEGORIES[0].slug}
          className={INPUT}
        >
          {COMMUNITY_CATEGORIES.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <Label>제목</Label>
        <input
          name="title"
          required
          minLength={2}
          maxLength={150}
          placeholder="제목을 입력하세요"
          className={INPUT}
        />
        {state.fieldErrors?.title && (
          <p className="mt-1 text-body-sm text-coral">{state.fieldErrors.title}</p>
        )}
      </div>

      <div>
        <Label>내용</Label>
        <textarea
          name="body"
          required
          rows={14}
          placeholder="내용을 입력하세요. 줄바꿈은 그대로 표시됩니다."
          className={`${INPUT} resize-y`}
        />
        {state.fieldErrors?.body && (
          <p className="mt-1 text-body-sm text-coral">{state.fieldErrors.body}</p>
        )}
      </div>

      {canWriteNotice && (
        <label className="inline-flex items-center gap-2 text-body-md text-ink">
          <input type="checkbox" name="is_notice" className="h-4 w-4 rounded border border-line" />
          공지로 등록 (관리자)
        </label>
      )}

      {state.error && !state.fieldErrors && (
        <p className="text-body-sm text-coral">{state.error}</p>
      )}

      <div className="flex justify-end">
        <SubmitBtn />
      </div>
    </form>
  );
}
