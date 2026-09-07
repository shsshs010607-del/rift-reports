"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { updateProfile, type ProfileState } from "@/app/me/actions";

export function ProfileEditor({
  username,
  bio,
}: {
  username: string;
  bio: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useFormState<ProfileState, FormData>(updateProfile, {});

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn-ghost !py-2 !text-label-md">
        프로필 편집
      </button>
    );
  }

  return (
    <form action={formAction} className="mt-3 flex flex-col gap-3 rounded-2xl border border-line/80 bg-card p-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-label-md font-bold text-ink">닉네임</span>
        <input
          name="username"
          defaultValue={username}
          maxLength={20}
          required
          className="field"
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-label-md font-bold text-ink">소개</span>
        <textarea
          name="bio"
          defaultValue={bio ?? ""}
          maxLength={300}
          rows={3}
          placeholder="한 줄 소개 (선택)"
          className="field"
        />
      </label>

      {state.error && <p className="text-body-sm text-coral">{state.error}</p>}
      {state.ok && <p className="text-body-sm text-emerald">저장했습니다.</p>}

      <div className="flex gap-2">
        <Save />
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="btn-ghost !py-2 !text-label-md"
        >
          닫기
        </button>
      </div>
    </form>
  );
}

function Save() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary !py-2 !text-label-md">
      {pending ? "저장 중…" : "저장"}
    </button>
  );
}
