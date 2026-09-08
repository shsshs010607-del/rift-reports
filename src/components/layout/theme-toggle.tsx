"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const KEY = "rr:theme";

/** 라이트/다크 전환. 선택은 localStorage 에 저장, <html data-theme> 로 반영. */
export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.dataset.theme === "dark");
    setReady(true);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
    try {
      localStorage.setItem(KEY, next ? "dark" : "light");
    } catch {
      /* noop */
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "라이트 모드로" : "다크 모드로"}
      title={dark ? "라이트 모드" : "다크 모드"}
      className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-on-surface-variant transition hover:bg-surface-container hover:text-on-surface"
    >
      {ready && dark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
    </button>
  );
}
