"use client";

import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { createClient } from "@/lib/supabase/client";
import { NICKNAME_RE } from "@/lib/auth/nickname";
import { setNickname, type NickState } from "@/app/onboarding/actions";

type Check = "idle" | "checking" | "ok" | "taken" | "invalid";

export function NicknameForm({ suggestion, next }: { suggestion: string; next: string }) {
  const [name, setName] = useState(suggestion);
  const [check, setCheck] = useState<Check>("idle");
  const [state, formAction] = useFormState<NickState, FormData>(setNickname, {});

  useEffect(() => {
    const v = name.trim();
    if (!v) return setCheck("idle");
    if (!NICKNAME_RE.test(v)) return setCheck("invalid");

    setCheck("checking");
    const ctrl = { cancelled: false };
    const t = setTimeout(async () => {
      const { data } = await createClient().rpc("username_available", { name: v });
      if (!ctrl.cancelled) setCheck(data ? "ok" : "taken");
    }, 400);
    return () => {
      ctrl.cancelled = true;
      clearTimeout(t);
    };
  }, [name]);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="next" value={next} />
      <label htmlFor="nickname" className="text-label-md font-bold text-ink">
        닉네임
      </label>
      <input
        id="nickname"
        name="nickname"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={20}
        autoFocus
        autoComplete="off"
        placeholder="2~20자 · 한글·영문·숫자"
        className="field"
      />

      <p className="min-h-[1.25rem] text-body-sm">
        {check === "checking" && <span className="text-ink-soft">확인 중…</span>}
        {check === "ok" && <span className="text-emerald">사용할 수 있는 닉네임이에요.</span>}
        {check === "taken" && <span className="text-coral">이미 사용 중인 닉네임이에요.</span>}
        {check === "invalid" && (
          <span className="text-coral">2~20자, 한글·영문·숫자·_- 만 가능해요.</span>
        )}
      </p>

      {state.error && <p className="text-body-sm text-coral">{state.error}</p>}

      <Submit ready={check === "ok"} />
    </form>
  );
}

function Submit({ ready }: { ready: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={!ready || pending} className="btn-primary mt-1 w-full">
      {pending ? "저장 중…" : "시작하기"}
    </button>
  );
}
