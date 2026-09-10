import { existsSync } from "node:fs";
import path from "node:path";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, CalendarClock, TrendingUp } from "lucide-react";

import { getPriceBoard } from "@/lib/prices";
import { getUsdKrw } from "@/lib/fx";
import { fmtKrw } from "@/lib/money";

/** T1 에디션(OGN) 정식 출시일 — KST. */
const RELEASE = new Date("2026-09-18T00:00:00+09:00");
/** public/ 아래 이미지 경로 (사용자가 넣으면 자동 노출, 없으면 플레이스홀더). */
const IMG_SRC = "/brand/t1-edition.jpg";
/** 파일 존재 여부는 모듈 로드 시 1회만 확인. */
const HAS_IMG = existsSync(path.join(process.cwd(), "public", "brand", "t1-edition.jpg"));

function dDay(): number {
  const now = new Date();
  const ms = RELEASE.getTime() - now.getTime();
  return Math.ceil(ms / 86_400_000);
}

/**
 * 홈 상단 유입용 프로모 — Riftbound OGN "T1 에디션" 9/18 출시 + 주요 카드 시세.
 * 이미지가 없으면 T1 컬러 플레이스홀더로 대체된다.
 */
export async function T1EditionBanner() {
  const hasImg = HAS_IMG;
  const [board, fx] = await Promise.all([getPriceBoard(120), getUsdKrw()]);
  // 일반 카드만 (시그니처*·쇼케이스·오버넘버드 변형 제외) → 대표 시세로 보이게
  const top = board
    .filter((r) => {
      const num = r.print?.number ?? "";
      if (r.market_price == null || num.includes("*")) return false;
      if (/showcase|쇼케이스/i.test(r.print?.rarity ?? "")) return false;
      const m = /^(\d+)\s*\/\s*(\d+)/.exec(num);
      if (m && Number(m[1]) > Number(m[2])) return false; // 오버넘버드
      return true;
    })
    .slice(0, 3);

  const d = dDay();
  const dLabel = d > 0 ? `D-${d}` : d === 0 ? "D-DAY" : "출시 완료";

  return (
    <section className="overflow-hidden rounded-2xl border border-[#e2012d]/30 bg-gradient-to-br from-[#0b0b0d] via-[#1b0509] to-[#400d15] text-white">
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-stretch sm:gap-5 sm:p-5">
        {/* 이미지 / 플레이스홀더 */}
        <div className="relative aspect-[16/9] w-full shrink-0 overflow-hidden rounded-xl bg-black/40 sm:aspect-square sm:w-40">
          {hasImg ? (
            <Image src={IMG_SRC} alt="Riftbound OGN T1 에디션" fill className="object-cover" sizes="160px" />
          ) : (
            <div className="grid h-full w-full place-items-center bg-[radial-gradient(circle_at_30%_20%,#e2012d33,transparent_60%)]">
              <span className="font-display text-4xl font-black tracking-tight text-white/90">T1</span>
            </div>
          )}
          <span className="absolute left-2 top-2 rounded-full bg-[#e2012d] px-2 py-0.5 text-[11px] font-black tracking-wide">
            {dLabel}
          </span>
        </div>

        {/* 카피 + CTA */}
        <div className="flex min-w-0 flex-1 flex-col justify-center">
          <p className="inline-flex items-center gap-1.5 text-label-sm font-bold uppercase tracking-wide text-[#ff5b78]">
            <CalendarClock className="h-3.5 w-3.5" />
            9월 18일 정식 출시
          </p>
          <h2 className="mt-1 font-display text-title-lg font-black leading-tight text-white sm:text-headline-sm">
            Riftbound OGN · T1 에디션
          </h2>
          <p className="mt-1.5 text-body-sm leading-relaxed text-white/70">
            출시 전부터 전체 카드 DB·덱 시뮬레이터·<strong className="text-white">실시간 시세</strong>를 리바지지에서
            미리 확인하세요.
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href="/trading"
              className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-body-sm font-bold text-[#1b0509] transition hover:bg-white/90"
            >
              카드 시세 보기 <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/cards"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/30 px-4 py-2 text-body-sm font-bold text-white transition hover:bg-white/10"
            >
              카드 DB
            </Link>
          </div>
        </div>

        {/* 시세 미니 */}
        {top.length > 0 && (
          <div className="shrink-0 rounded-xl bg-white/[0.06] p-3 sm:w-52">
            <p className="mb-1.5 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-white/60">
              <TrendingUp className="h-3 w-3" />
              주요 카드 시세
            </p>
            <ul className="flex flex-col gap-1">
              {top.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/trading/cards/${r.print_id}`}
                    className="flex items-baseline gap-2 rounded-md px-1.5 py-1 transition hover:bg-white/10"
                  >
                    <span className="min-w-0 flex-1 truncate text-[12px] text-white/85">
                      {r.print?.ko_name || r.print?.name || "—"}
                    </span>
                    <span className="shrink-0 text-[12px] font-bold tabular-nums text-white">
                      {fmtKrw(r.market_price, fx.usdKrw)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              href="/trading"
              className="mt-1.5 block text-right text-[11px] font-semibold text-[#ff5b78] hover:underline"
            >
              전체 시세표 →
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
