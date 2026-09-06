"use client";

import { useFormState, useFormStatus } from "react-dom";
import { createPost, type ActionState } from "@/lib/actions/community";
import { COMMUNITY_CATEGORIES } from "@/lib/constants";

const initial: ActionState = {};

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary">
      {pending ? "등록 중…" : "등록"}
    </button>
  );
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
        <label className="mb-1 block text-label-lg text-ink">게시판</label>
        <select name="category" defaultValue={defaultCategory ?? COMMUNITY_CATEGORIES[0].slug} className="field">
          {COMMUNITY_CATEGORIES.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-label-lg text-ink">제목</label>
        <input name="title" required minLength={2} maxLength={150} className="field" />
        {state.fieldErrors?.title && (
          <p className="mt-1 text-body-sm text-coral">{state.fieldErrors.title}</p>
        )}
      </div>

      <div>
        <label className="mb-1 block text-label-lg text-ink">내용</label>
        <textarea name="body" required rows={14} className="field resize-y" />
        {state.fieldErrors?.body && (
          <p className="mt-1 text-body-sm text-coral">{state.fieldErrors.body}</p>
        )}
      </div>

      {canWriteNotice && (
        <label className="inline-flex items-center gap-2 text-body-md text-ink">
          <input type="checkbox" name="is_notice" className="h-4 w-4 rounded border-2 border-line" />
          공지로 등록 (관리자)
        </label>
      )}

      {state.error && <p className="text-body-sm text-coral">{state.error}</p>}

      <div className="flex justify-end gap-2">
        <SubmitBtn />
      </div>
    </form>
  );
}
