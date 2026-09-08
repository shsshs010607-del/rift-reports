import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import { SITE, ADSENSE } from "@/lib/constants";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import "./globals.css";

const display = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

const body = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: `${SITE.name} (${SITE.nameEn}) · 리프트바운드 커뮤니티`, template: `%s · ${SITE.name}` },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: [
    "리바지지",
    "RIBA.GG",
    "리바지지 리프트바운드",
    "리프트바운드",
    "Riftbound",
    "리프트바운드 티어리스트",
    "리프트바운드 덱",
    "리프트바운드 카드",
    "리프트바운드 시세",
    "리프트바운드 커뮤니티",
    "롤 TCG",
    "라이엇 TCG",
    "League of Legends TCG",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    title: `${SITE.name} · ${SITE.nameEn}`,
    description: SITE.description,
    url: SITE.url,
    siteName: SITE.name,
    locale: "ko_KR",
    type: "website",
  },
  twitter: { card: "summary_large_image", title: SITE.name, description: SITE.description },
  // AdSense 사이트 확인용 <meta name="google-adsense-account"> (head 에 렌더됨)
  ...(ADSENSE.client ? { other: { "google-adsense-account": ADSENSE.client } } : {}),
};

/** 검색엔진용 구조화 데이터 (WebSite + 사이트 검색). */
const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE.name,
  alternateName: [SITE.nameEn, "리바지지", "RIBA.GG"],
  url: SITE.url,
  description: SITE.description,
  inLanguage: "ko-KR",
  potentialAction: {
    "@type": "SearchAction",
    target: `${SITE.url.replace(/\/$/, "")}/cards?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fcf8ff" },
    { media: "(prefers-color-scheme: dark)", color: "#12111b" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${display.variable} ${body.variable}`}>
      <body className="flex min-h-screen flex-col bg-background">
        {/* 테마 — 페인트 전 적용해 깜빡임 방지 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('rr:theme');if(t==='dark'||t==='light')document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`,
          }}
        />
        {/* 한글 글리프 — Pretendard 폴백 (App Router 가 <head> 로 호이스팅) */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
        />
        {ADSENSE.client && (
          <Script
            id="adsbygoogle-init"
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE.client}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        )}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-label-md focus:font-bold focus:text-white"
        >
          본문 바로가기
        </a>
        <Navbar />
        <main id="main" className="w-full flex-1 pt-[68px] xl:pt-[116px]">
          <div className="mx-auto w-full max-w-[1280px] px-gutter-desktop py-space-xl">{children}</div>
        </main>
        <Footer />
      </body>
    </html>
  );
}
