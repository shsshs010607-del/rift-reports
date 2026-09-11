"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

/** 일정 스크롤 이후 뜨는 맨 위로 가기 버튼. 전 페이지 공통(RootLayout). */
export function BackToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 480);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="맨 위로 가기"
      title="맨 위로"
      className={cn(
        "fixed bottom-5 right-4 z-40 grid h-11 w-11 place-items-center rounded-full border border-line bg-card text-ink-soft shadow-e2 transition-all duration-200 sm:bottom-6 sm:right-6",
        "hover:border-primary/40 hover:text-primary-strong",
        show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0",
      )}
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
}
