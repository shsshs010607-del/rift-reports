"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { ADSENSE } from "@/lib/constants";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/**
 * AdSense 디스플레이 광고 한 칸.
 * NEXT_PUBLIC_ADSENSE_CLIENT / *_FOOTER_SLOT 이 없으면 아무것도 렌더하지 않는다.
 */
export function AdSenseUnit({
  slot,
  className,
}: {
  slot?: string;
  className?: string;
}) {
  const client = ADSENSE.client;
  const adSlot = slot ?? ADSENSE.footerSlot;
  const pathname = usePathname();

  useEffect(() => {
    if (!client || !adSlot) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      /* 로더가 아직 안 붙었거나 광고 차단 — 무시 */
    }
  }, [client, adSlot, pathname]);

  if (!client || !adSlot) return null;

  return (
    <aside className={className} aria-label="광고">
      <p className="mb-1 text-center text-label-sm text-on-surface-variant/70">광고</p>
      <ins
        key={pathname}
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={client}
        data-ad-slot={adSlot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  );
}
