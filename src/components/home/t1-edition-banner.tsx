import { existsSync } from "node:fs";
import path from "node:path";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";

/** T1 번들 박스 사진. public/brand/t1-bundle.jpg 넣으면 자동 노출, 없으면 플레이스홀더. */
const BOX_IMG = "/brand/t1-bundle.jpg";
const HAS_BOX = existsSync(path.join(process.cwd(), "public", "brand", "t1-bundle.jpg"));

/** eBay 검색 (판매 완료). */
const EBAY_URL =
  "https://www.ebay.com/sch/i.html?_nkw=Riftbound+T1+Signature+Edition&LH_Sold=1&LH_Complete=1";

/**
 * eBay 실거래가(해외 리셀 시장). 수치는 수동 갱신 — updatedAt 이 기준일.
 * (자동 시세 연동 없음)
 */
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
    <section className="h-full overflow-hidden rounded-2xl border border-[#e2012d]/30 bg-gradient-to-br from-[#0b0b0d] via-[#1b0509] to-[#3a0d15] text-white">
      <div className="flex h-full items-center gap-3.5 p-3.5 sm:gap-6 sm:p-5">
        {/* 번들 박스 사진 */}
        <div className="relative aspect-square h-[104px] shrink-0 overflow-hidden rounded-xl bg-black/40 ring-1 ring-white/10 sm:h-[128px]">
          {HAS_BOX ? (
            <Image src={BOX_IMG} alt="T1 번들 박스" fill sizes="128px" className="object-cover" />
          ) : (
            <div className="grid h-full w-full place-items-center bg-[radial-gradient(circle_at_30%_20%,#e2012d33,transparent_60%)] text-center">
              <span className="font-display text-3xl font-black text-white/90">T1</span>
            </div>
          )}
        </div>

        {/* 내용 */}
        <div className="min-w-0 flex-1">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e2012d] px-2 py-0.5 text-[10px] font-black tracking-wide text-white">
            리셀 시장가
          </span>
          <h2 className="mt-1.5 font-display text-title-lg font-black leading-tight text-white sm:text-headline-sm">
            리프트바운드 <span className="text-[#ff5b78]">×</span> T1 에디션
          </h2>
          <p className="text-[12px] text-white/60">
            2025 월드 챔피언 · 페이커·구마유시 등 5종 · eBay 시세 {RESALE.updatedAt} 기준
          </p>

          <dl className="mt-2 flex flex-col gap-1">
            {RESALE.rows.map((b) => (
              <div
                key={b.name}
                className="flex items-baseline justify-between gap-3 border-b border-white/10 pb-1 last:border-0"
              >
                <dt className="min-w-0 truncate">
                  <span className="text-body-sm font-bold text-white">{b.name}</span>
                  <span className="ml-1.5 hidden text-[11px] text-white/50 sm:inline">{b.sub}</span>
                </dt>
                <dd className="shrink-0 text-body-sm font-black tabular-nums text-white">{b.price}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-2.5">
            <a
              href={EBAY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-label-sm font-bold text-[#1b0509] transition hover:bg-white/90"
            >
              eBay 실거래 보기 <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
