"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { GA } from "@/lib/constants";
import { gaAllowedHere } from "@/lib/analytics";

/**
 * Google Analytics 4 (gtag.js). 허용 호스트(riba.gg)에서만 주입한다.
 * 프리뷰(*.vercel.app)·localhost 에선 스크립트 자체를 안 넣어
 * 실 분석 데이터에 개발용 트래픽이 안 섞이게 한다. (AdSenseScript 와 동일 패턴)
 */
export function GoogleAnalytics() {
  const [ok, setOk] = useState(false);
  useEffect(() => setOk(gaAllowedHere()), []);

  if (!ok) return null;

  return (
    <>
      <Script
        id="gtag-src"
        async
        src={`https://www.googletagmanager.com/gtag/js?id=${GA.id}`}
        strategy="afterInteractive"
      />
      <Script id="gtag-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA.id}');`}
      </Script>
    </>
  );
}
