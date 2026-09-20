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
  const [unfilled, setUnfilled] = useState(false);

  useEffect(() => setAllowed(adsAllowedHere()), []);

  // 구글이 채울 광고가 없으면 <ins data-ad-status="unfilled"> 로 표시한다 — 빈 칸과 "광고" 라벨만 남지 않게 접는다.
  useEffect(() => {
    const el = insRef.current;
    if (!allowed || !el) return;
    const sync = () => setUnfilled(el.getAttribute("data-ad-status") === "unfilled");
    sync();
    const mo = new MutationObserver(sync);
    mo.observe(el, { attributes: true, attributeFilter: ["data-ad-status"] });
    return () => mo.disconnect();
  }, [allowed, pathname]);

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
    <aside className={unfilled ? "hidden" : className} aria-label="광고">
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
