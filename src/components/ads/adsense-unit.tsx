"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ADSENSE } from "@/lib/constants";
import { adsAllowedHere } from "@/lib/ads";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/**
 * AdSense 디스플레이 광고 한 칸.
 * client/slot 이 없으면 아무것도 렌더하지 않는다.
 * <ins> 가 실제 폭을 가진 뒤에만 push() 해서 "availableWidth=0" 오류를 피한다.
 */
export function AdSenseUnit({ slot, className }: { slot?: string; className?: string }) {
  const client = ADSENSE.client;
  const adSlot = slot ?? ADSENSE.footerSlot;
  const pathname = usePathname();
  const insRef = useRef<HTMLModElement>(null);
  const pushedRef = useRef(false);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => setAllowed(adsAllowedHere()), []);

  useEffect(() => {
    pushedRef.current = false;
  }, [pathname]);

  useEffect(() => {
    if (!allowed || !client || !adSlot) return;
    const el = insRef.current;
    if (!el) return;

    const tryPush = () => {
      if (pushedRef.current) return true;
      if (!el.offsetParent || el.offsetWidth === 0) return false;
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        pushedRef.current = true;
      } catch {
        /* 로더 미도착 / 광고 차단 — 무시 */
      }
      return true;
    };

    if (tryPush()) return;

    // 아직 폭이 0 → 레이아웃될 때까지 관찰
    const ro = new ResizeObserver(() => {
      if (tryPush()) ro.disconnect();
    });
    ro.observe(el);
    const t = window.setTimeout(() => {
      tryPush();
      ro.disconnect();
    }, 3000);

    return () => {
      ro.disconnect();
      window.clearTimeout(t);
    };
  }, [allowed, client, adSlot, pathname]);

  if (!allowed || !client || !adSlot) return null;

  return (
    <aside className={className} aria-label="광고">
      <p className="mb-1 text-center text-label-sm text-on-surface-variant/70">광고</p>
      <ins
        key={pathname}
        ref={insRef}
        className="adsbygoogle"
        style={{ display: "block", minWidth: "250px", width: "100%" }}
        data-ad-client={client}
        data-ad-slot={adSlot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  );
}
