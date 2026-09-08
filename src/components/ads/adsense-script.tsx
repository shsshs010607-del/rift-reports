"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { ADSENSE } from "@/lib/constants";
import { adsAllowedHere } from "@/lib/ads";

/**
 * AdSense 로더 스크립트. 허용 호스트(riba.gg)에서만 주입한다.
 * 프리뷰(*.vercel.app)·localhost 에선 스크립트 자체를 안 넣어
 * 콘솔 오류·정책 위반을 피한다.
 */
export function AdSenseScript() {
  const [ok, setOk] = useState(false);
  useEffect(() => setOk(adsAllowedHere()), []);

  if (!ok) return null;

  return (
    <Script
      id="adsbygoogle-init"
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE.client}`}
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  );
}
