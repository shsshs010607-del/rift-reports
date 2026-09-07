"use client";

import { useState } from "react";
import type { Provider } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { hasSupabaseEnv } from "@/lib/supabase/env";

type Social = {
  provider: Extract<Provider, "kakao" | "google" | "discord">;
  label: string;
  className: string;
  icon: React.ReactNode;
};

const SOCIALS: Social[] = [
  {
    provider: "kakao",
    label: "카카오로 시작하기",
    className: "bg-[#FEE500] text-[#191600] hover:bg-[#f5dd00]",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden fill="currentColor">
        <path d="M12 3C6.9 3 2.8 6.3 2.8 10.3c0 2.6 1.7 4.9 4.3 6.2-.2.7-.7 2.5-.8 2.9-.1.5.2.5.4.4.2-.1 2.5-1.7 3.5-2.4.5.1 1 .1 1.6.1 5.1 0 9.2-3.3 9.2-7.3S17.1 3 12 3Z" />
      </svg>
    ),
  },
  {
    provider: "google",
    label: "Google로 시작하기",
    className: "border border-line bg-card text-ink hover:bg-subcanvas",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
        <path fill="#4285F4" d="M23 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.2a5.3 5.3 0 0 1-2.3 3.5v2.9h3.7c2.2-2 3.4-5 3.4-8.6Z" />
        <path fill="#34A853" d="M12 24c3.1 0 5.7-1 7.6-2.8l-3.7-2.9c-1 .7-2.3 1.1-3.9 1.1-3 0-5.6-2-6.5-4.8H1.6v3C3.5 21.3 7.5 24 12 24Z" />
        <path fill="#FBBC05" d="M5.5 14.3a7.2 7.2 0 0 1 0-4.6v-3H1.6a12 12 0 0 0 0 10.6l3.9-3Z" />
        <path fill="#EA4335" d="M12 4.8c1.7 0 3.2.6 4.4 1.7l3.3-3.3C17.7 1.2 15.1 0 12 0 7.5 0 3.5 2.7 1.6 6.7l3.9 3C6.4 6.8 9 4.8 12 4.8Z" />
      </svg>
    ),
  },
  {
    provider: "discord",
    label: "Discord로 시작하기",
    className: "bg-[#5865F2] text-white hover:bg-[#4c58da]",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden fill="currentColor">
        <path d="M20.3 4.4A19.8 19.8 0 0 0 15.4 3l-.2.5c1.7.4 3.2 1 4.6 1.9a13.4 13.4 0 0 0-11.6 0c1.4-.9 3-1.5 4.6-1.9L12.6 3a19.8 19.8 0 0 0-4.9 1.4C4.5 9.1 3.6 13.7 4 18.2a20 20 0 0 0 6 3l.8-1.3c-.7-.3-1.4-.6-2-1l.5-.4c3.9 1.8 8.1 1.8 12 0l.5.4c-.7.4-1.3.7-2 1l.8 1.3a20 20 0 0 0 6-3c.5-5.2-.8-9.8-3.6-13.8ZM9.5 15.4c-1.2 0-2.1-1.1-2.1-2.4 0-1.3.9-2.4 2.1-2.4 1.2 0 2.2 1.1 2.1 2.4 0 1.3-.9 2.4-2.1 2.4Zm5 0c-1.2 0-2.1-1.1-2.1-2.4 0-1.3.9-2.4 2.1-2.4 1.2 0 2.2 1.1 2.1 2.4 0 1.3-.9 2.4-2.1 2.4Z" />
      </svg>
    ),
  },
];

export function LoginForm({ next }: { next?: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const redirectTo = () => {
    const base = typeof window !== "undefined" ? window.location.origin : "";
    return `${base}/auth/callback${next ? `?next=${encodeURIComponent(next)}` : ""}`;
  };

  async function signInWith(provider: Social["provider"]) {
    setBusy(provider);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: redirectTo() },
    });
    if (error) {
      setBusy(null);
      setStatus("error");
      setMessage(error.message);
    }
  }

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo() },
    });
    if (error) {
      setStatus("error");
      setMessage(error.message);
    } else {
      setStatus("sent");
      setMessage("메일함을 확인해 로그인 링크를 클릭하세요.");
    }
  }

  if (!hasSupabaseEnv) {
    return (
      <p className="text-body-sm text-ink-soft">
        아직 Supabase 환경변수가 설정되지 않았습니다. <code>.env.local</code> 에 키를 입력하면 로그인이 활성화됩니다.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {SOCIALS.map((s) => (
        <button
          key={s.provider}
          type="button"
          onClick={() => signInWith(s.provider)}
          disabled={busy != null}
          className={`inline-flex w-full items-center justify-center gap-2.5 rounded-xl px-4 py-2.5 text-label-lg font-bold transition disabled:opacity-60 ${s.className}`}
        >
          {s.icon}
          {busy === s.provider ? "이동 중…" : s.label}
        </button>
      ))}

      <div className="mt-1 flex items-center gap-3 text-body-sm text-ink-soft">
        <span className="h-px flex-1 bg-line" />
        이메일로 로그인
        <span className="h-px flex-1 bg-line" />
      </div>

      <form onSubmit={sendMagicLink} className="flex flex-col gap-2">
        <input
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="field"
        />
        <button type="submit" disabled={status === "sending"} className="btn-ghost w-full !py-2.5">
          {status === "sending" ? "전송 중…" : "매직 링크 받기"}
        </button>
      </form>

      {message && (
        <p className={status === "error" ? "text-body-sm text-coral" : "text-body-sm text-emerald"}>
          {message}
        </p>
      )}
    </div>
  );
}
