import { existsSync } from "node:fs";
import path from "node:path";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";

/**
 * T1 에디션 제품 사진. public/brand/ 에 아래 이름 중 하나로 넣으면 자동 노출.
 * (라이엇 x T1 시그니처 에디션 아크릴 케이스 렌더 이미지 권장)
 */
const IMG_CANDIDATES = ["t1-bundle.jpg", "t1-bundle.png", "t1-bundle.webp"];
const BOX_IMG = (() => {
  const dir = path.join(process.cwd(), "public", "brand");
  const hit = IMG_CANDIDATES.find((f) => existsSync(path.join(dir, f)));
  return hit ? `/brand/${hit}` : null;
})();

/** eBay 검색 (판매 완료). */
const EBAY_URL =
  "https://www.ebay.com/sch/i.html?_nkw=Riftbound+T1+Signature+Edition&LH_Sold=1&LH_Complete=1";

/** eBay 실거래가(해외 리셀). 수동 갱신 — updatedAt 이 기준일. */
const RESALE = {
  updatedAt: "2026-09-11",
  rows: [
    { name: "정가 (라이엇)", sub: "언어별 10,125세트 한정", price: "₩500,000" },
    { name: "eBay 실거래", sub: "미개봉 세트 · 편차 큼", price: "$4,000~6,000" },
  ],
};

/** 홈 상단 유입 프로모 — 리프트바운드 × T1 시그니처 에디션 + eBay 실거래가. */
export function T1EditionBanner() {
  return (
    <section className="relative flex h-full min-h-[168px] overflow-hidden rounded-2xl border border-[#e2012d]/40 bg-[#0a0708] text-white">
      {/* 배경: 제품 사진 (오른쪽에서 왼쪽으로 페이드) */}
      {BOX_IMG ? (
        <div className="pointer-events-none absolute inset-y-0 right-0 w-[68%] sm:w-[58%]">
          <Image src={BOX_IMG} alt="리프트바운드 × T1 시그니처 에디션" fill className="object-cover object-center" sizes="(max-width:640px) 68vw, 420px" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0708] via-[#0a0708]/55 to-[#0a0708]/10" />
        </div>
      ) : (
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_100%_at_100%_0%,#e2012d40,transparent_55%),linear-gradient(120deg,#0a0708,#1b0509_55%,#3a0d15)]" />
      )}

      {/* 내용 */}
      <div className="relative z-10 flex max-w-[62%] flex-col justify-center gap-1.5 p-4 sm:max-w-[54%] sm:p-5">
        <span className="inline-flex w-fit items-center gap-1 rounded-full bg-[#e2012d] px-2 py-0.5 text-[10px] font-black tracking-wide text-white shadow-lg">
          RIFTBOUND <span className="opacity-70">×</span> T1 · 리셀 시장가
        </span>
        <h2 className="font-display text-title-lg font-black leading-tight drop-shadow sm:text-headline-sm">
          T1 시그니처 에디션
        </h2>
        <p className="text-[11px] leading-snug text-white/70">
          2025 월드 챔피언 · 페이커·구마유시 등 5종 · 금박 사인
        </p>

        <dl className="mt-1 flex flex-col gap-0.5">
          {RESALE.rows.map((b) => (
            <div key={b.name} className="flex items-baseline justify-between gap-3">
              <dt className="min-w-0 truncate text-body-sm font-bold text-white/90">
                {b.name}
                <span className="ml-1.5 hidden text-[11px] font-normal text-white/45 sm:inline">
                  {b.sub}
                </span>
              </dt>
              <dd className="shrink-0 text-body-sm font-black tabular-nums text-white">{b.price}</dd>
            </div>
          ))}
        </dl>

        <a
          href={EBAY_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1.5 inline-flex w-fit items-center gap-1 rounded-full bg-white px-3 py-1.5 text-label-sm font-bold text-[#1b0509] transition hover:bg-white/90"
        >
          eBay 실거래 보기 <ArrowUpRight className="h-3.5 w-3.5" />
        </a>
        <p className="text-[10px] text-white/40">eBay 시세 {RESALE.updatedAt} 기준</p>
      </div>
    </section>
  );
}
