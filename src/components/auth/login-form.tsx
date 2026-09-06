"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { SITE } from "@/lib/constants";

export function LoginForm({ next }: { next?: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  const redirectTo = `${SITE.url}/auth/callback${next ? `?next=${encodeURIComponent(next)}` : ""}`;

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });
    if (error) {
      setStatus("error");
      setMessage(error.message);
    } else {
      setStatus("sent");
      setMessage("메일함을 확인해 로그인 링크를 클릭하세요.");
    }
  }

  async function signInWithGoogle() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
  }

  if (!hasSupabaseEnv) {
    return (
      <p className="text-body-sm text-ink-soft">
        아직 Supabase 환경변수가 설정되지 않았습니다. <code>.env.local</code> 에 키를 입력하면 로그인이 활성화됩니다.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <button type="button" onClick={signInWithGoogle} className="btn-ghost w-full">
        Google 계정으로 계속하기
      </button>

      <div className="flex items-center gap-3 text-body-sm text-ink-soft">
        <span className="h-px flex-1 bg-line" />
        또는
        <span className="h-px flex-1 bg-line" />
      </div>

      <form onSubmit={sendMagicLink} className="flex flex-col gap-3">
        <input
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="field"
        />
        <button type="submit" disabled={status === "sending"} className="btn-primary w-full">
          {status === "sending" ? "전송 중…" : "매직 링크 받기"}
        </button>
      </form>

      {message && (
        <p className={status === "error" ? "text-body-sm text-coral" : "text-body-sm text-emerald"}>{message}</p>
      )}
    </div>
  );
}
