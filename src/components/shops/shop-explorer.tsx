"use client";

import { useState } from "react";
import { MapPin, Search, ShieldCheck, Store } from "lucide-react";

import { KR_SIDO } from "@/lib/constants";
import { cn } from "@/lib/utils";

/**
 * 카드샵 탐색 UI 셸. 아직 shops 테이블(Supabase)이 없어 데이터는 비어 있다.
 * 스키마·API 설계는 docs/shops-and-events.md 참고.
 */
export function ShopExplorer() {
  const [sido, setSido] = useState<string>("");
  const [officialOnly, setOfficialOnly] = useState(false);
  const [q, setQ] = useState("");

  return (
    <div className="flex flex-col gap-4">
      {/* 필터 바 */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-line bg-card p-3">
        <select
          value={sido}
          onChange={(e) => setSido(e.target.value)}
          className="rounded-xl border border-line bg-subcanvas/50 px-3 py-2 text-body-sm text-ink focus:border-primary focus:outline-none"
        >
          <option value="">시/도 전체</option>
          {KR_SIDO.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => setOfficialOnly((v) => !v)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-label-md font-semibold transition",
            officialOnly
              ? "border-amber bg-amber/15 text-amber-strong"
              : "border-line text-ink-soft hover:border-primary/40",
          )}
        >
          <ShieldCheck className="h-4 w-4" />
          공인샵만
        </button>

        <div className="relative min-w-[180px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="매장명 검색"
            className="w-full rounded-xl border border-line bg-subcanvas/50 py-2 pl-9 pr-3 text-body-sm text-ink focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_minmax(300px,420px)]">
        {/* 목록 (빈 상태) */}
        <div className="grid place-items-center rounded-2xl border-2 border-dashed border-line bg-subcanvas/40 p-12 text-center">
          <Store className="h-8 w-8 text-ink-soft" />
          <p className="mt-3 font-display text-title-md text-ink">
            {sido ? `${sido} 지역 카드샵 준비 중` : "카드샵 데이터 준비 중"}
          </p>
          <p className="mt-1 max-w-sm text-body-sm text-ink-soft">
            시/도·시/군/구별 카드샵 검색, 공인샵 배지, 매장별 대회 일정을 곧 제공합니다.
            매장 제보를 받고 있어요.
          </p>
          <a
            href="/community/recruit"
            className="btn-ghost mt-4 !py-2 !text-label-md"
          >
            매장 제보하기
          </a>
        </div>

        {/* 지도 (플레이스홀더) */}
        <div className="relative grid min-h-[280px] place-items-center overflow-hidden rounded-2xl border border-line bg-subcanvas/60">
          <div className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:linear-gradient(#000_1px,transparent_1px),linear-gradient(90deg,#000_1px,transparent_1px)] [background-size:24px_24px]" />
          <div className="relative flex flex-col items-center text-ink-soft">
            <MapPin className="h-7 w-7" />
            <p className="mt-2 text-body-sm">Kakao 지도 · 공인샵 마커</p>
            <p className="text-label-sm">연동 예정</p>
          </div>
        </div>
      </div>
    </div>
  );
}
