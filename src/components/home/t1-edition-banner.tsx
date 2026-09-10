import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

/** 리프트바운드 × 2025 월드 챔피언 T1 — 정식 출시일(KST). */
const RELEASE = new Date("2026-09-18T00:00:00+09:00");

/** 장식용 카드 아트 (Riot 공식 CDN). 실제 T1 카드 이미지는 미공개라 OGN 카드로 대체. */
const FAN = [
  {
    src: "https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/68e4d3230b785738ae9d86f780f7f5607ef11807-744x1040.png?accountingTag=RB",
    rot: "-14deg",
    z: 10,
  },
  {
    src: "https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/3c7b219245cd6c6ee835974dd74771bc605289de-744x1039.png?accountingTag=RB",
    rot: "-1deg",
    z: 30,
  },
  {
    src: "https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/fbce641f5e4d8cdf2956e8ead5884b6cd3ccd90d-744x1040.png?accountingTag=RB",
    rot: "12deg",
    z: 20,
  },
];

const BUNDLES = [
  { name: "시그니처 에디션", note: "언어별 10,125세트 · 금박 사인", price: "₩500,000" },
  { name: "플레이어 번들", note: "게임 사용 가능 · 챔피언 카드 5종", price: "₩100,000" },
];

function dDay(): number {
  return Math.ceil((RELEASE.getTime() - Date.now()) / 86_400_000);
}

/** 홈 상단 유입 프로모 — 리프트바운드 × T1, 9/18 출시 + 번들 정가. */
export function T1EditionBanner() {
  const d = dDay();
  const dLabel = d > 0 ? `D-${d}` : d === 0 ? "D-DAY" : "출시";

  return (
    <section className="h-full overflow-hidden rounded-2xl border border-[#e2012d]/30 bg-gradient-to-br from-[#0b0b0d] via-[#1b0509] to-[#3a0d15] text-white">
      <div className="flex h-full items-center gap-3.5 p-3.5 sm:gap-6 sm:p-5">
        {/* 카드 아트 팬 */}
        <div className="relative h-[92px] w-[92px] shrink-0 sm:h-[116px] sm:w-[136px]">
          {FAN.map((c, i) => (
            <span
              key={i}
              className="absolute left-0 top-1/2 block w-[48px] overflow-hidden rounded-[3px] shadow-lg ring-1 ring-white/15 sm:w-[66px]"
              style={{
                transform: `translateX(${i * 44}%) translateY(-50%) rotate(${c.rot})`,
                zIndex: c.z,
              }}
            >
              <Image src={c.src} alt="" width={66} height={92} className="h-auto w-full" />
            </span>
          ))}
        </div>

        {/* 내용 */}
        <div className="min-w-0 flex-1">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e2012d] px-2 py-0.5 text-[10px] font-black tracking-wide text-white">
            9월 18일 출시 · {dLabel}
          </span>
          <h2 className="mt-1.5 font-display text-title-lg font-black leading-tight text-white sm:text-headline-sm">
            리프트바운드 <span className="text-[#ff5b78]">×</span> T1
          </h2>
          <p className="text-[12px] text-white/60">2025 월드 챔피언 기념 에디션</p>

          <dl className="mt-2 flex flex-col gap-1">
            {BUNDLES.map((b) => (
              <div
                key={b.name}
                className="flex items-baseline justify-between gap-3 border-b border-white/10 pb-1 last:border-0"
              >
                <dt className="min-w-0 truncate">
                  <span className="text-body-sm font-bold text-white">{b.name}</span>
                  <span className="ml-1.5 hidden text-[11px] text-white/50 sm:inline">{b.note}</span>
                </dt>
                <dd className="shrink-0 text-body-sm font-black tabular-nums text-white">{b.price}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <span className="text-[11px] text-white/50">예약: T1 멤버십 · KREAM</span>
            <Link
              href="/cards?setCode=OGN"
              className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-label-sm font-bold text-[#1b0509] transition hover:bg-white/90"
            >
              OGN 카드 보기 <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
