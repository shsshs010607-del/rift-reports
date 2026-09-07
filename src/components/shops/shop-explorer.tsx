"use client";

import { useMemo, useState } from "react";
import { Search, ShieldCheck, Phone, Clock, ExternalLink, MapPin, Map as MapIcon } from "lucide-react";
import { KR_SIDO } from "@/lib/constants";
import type { Shop } from "@/lib/types/database";
import { cn } from "@/lib/utils";

const kakaoMapUrl = (s: Shop) =>
  `https://map.kakao.com/?q=${encodeURIComponent(`${s.name} ${s.sido} ${s.sigungu ?? ""}`.trim())}`;

export function ShopExplorer({ shops }: { shops: Shop[] }) {
  const [sido, setSido] = useState("");
  const [officialOnly, setOfficialOnly] = useState(false);
  const [q, setQ] = useState("");

  const view = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return shops.filter((s) => {
      if (sido && s.sido !== sido) return false;
      if (officialOnly && !s.is_official) return false;
      if (needle) {
        const hay = `${s.name} ${s.address} ${s.sigungu ?? ""}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [shops, sido, officialOnly, q]);

  const sidos = useMemo(() => {
    const set = new Set(shops.map((s) => s.sido));
    return KR_SIDO.filter((s) => set.has(s));
  }, [shops]);

  const grouped = useMemo(() => {
    const map = new Map<string, Shop[]>();
    for (const s of view) {
      const arr = map.get(s.sido) ?? [];
      arr.push(s);
      map.set(s.sido, arr);
    }
    return KR_SIDO.filter((r) => map.has(r)).map((region) => ({
      region,
      items: map.get(region)!,
    }));
  }, [view]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-line/70 bg-card p-3">
        <select
          value={sido}
          onChange={(e) => setSido(e.target.value)}
          className="rounded-full border border-line bg-card px-3 py-1.5 text-body-sm text-ink"
        >
          <option value="">시/도 전체</option>
          {(sidos.length ? sidos : KR_SIDO).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => setOfficialOnly((v) => !v)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-label-md font-bold transition",
            officialOnly
              ? "border-amber-400 bg-amber-100 text-amber-700"
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
            placeholder="매장명 · 주소 검색"
            className="w-full rounded-full border border-line bg-card py-2 pl-9 pr-3 text-body-sm text-ink placeholder:text-ink-soft/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
          />
        </div>

        <span className="ml-auto text-label-sm text-ink-soft">{view.length}곳</span>
      </div>

      <div className="flex flex-col gap-5">
        {shops.length === 0 ? (
          <EmptyState />
        ) : view.length === 0 ? (
          <p className="grid place-items-center rounded-2xl border border-line/70 bg-card p-12 text-center text-body-sm text-ink-soft">
            조건에 맞는 매장이 없습니다.
          </p>
        ) : (
          grouped.map(({ region, items }) => (
            <section key={region}>
              <h3 className="mb-2 flex items-baseline gap-1.5 px-1 text-title-md font-bold text-ink">
                {region}
                <span className="text-label-sm font-normal text-ink-soft">{items.length}</span>
              </h3>
              <ul className="grid gap-2 sm:grid-cols-2">
                {items.map((s) => (
                  <li
                    key={s.id}
                    className="flex flex-col rounded-2xl border border-line/70 bg-card p-3.5"
                  >
                    <div className="flex items-center gap-2">
                      {s.is_official && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-1.5 py-0.5 text-[11px] font-bold text-amber-700">
                          <ShieldCheck className="h-3 w-3" />
                          공인샵
                        </span>
                      )}
                      <span className="font-display text-title-md font-bold text-ink">{s.name}</span>
                    </div>
                    <p className="mt-1 flex items-start gap-1.5 text-body-sm text-ink-soft">
                      <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      {s.sido} {s.sigungu ?? ""} · {s.address}
                    </p>
                    {(s.phone || s.hours) && (
                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-body-sm text-ink-soft">
                        {s.phone && (
                          <span className="inline-flex items-center gap-1">
                            <Phone className="h-3.5 w-3.5" />
                            {s.phone}
                          </span>
                        )}
                        {s.hours && (
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {s.hours}
                          </span>
                        )}
                      </div>
                    )}
                    {s.note && <p className="mt-1 text-body-sm text-ink-soft">{s.note}</p>}

                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      <a
                        href={kakaoMapUrl(s)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-full bg-[#FEE500] px-3 py-1.5 text-label-sm font-bold text-[#191600] transition hover:bg-[#f5dd00]"
                      >
                        <MapIcon className="h-3.5 w-3.5" />
                        카카오맵에서 보기
                      </a>
                      {s.url && (
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-label-sm font-bold text-ink-soft transition hover:text-ink"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          홈페이지
                        </a>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}

        {shops.length > 0 && (
          <p className="rounded-xl bg-subcanvas/60 px-3.5 py-2.5 text-body-sm text-ink-soft">
            매장 정보는 커뮤니티 제보 기반입니다. 방문 전 매장에 리프트바운드 취급 여부를 직접
            확인하세요. 신규 매장·정정 제보는{" "}
            <a href="/community/recruit" className="font-bold text-primary-strong">
              커뮤니티
            </a>{" "}
            또는 디스코드로 알려주세요.
          </p>
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="grid place-items-center rounded-2xl border border-line/70 bg-card p-12 text-center">
      <MapPin className="h-8 w-8 text-ink-soft" />
      <p className="mt-3 font-display text-title-md text-ink">등록된 카드샵이 없습니다</p>
      <p className="mt-1 max-w-sm text-body-sm text-ink-soft">
        운영진이 매장을 등록하면 여기 지역별로 표시됩니다. 매장 제보를 받고 있어요.
      </p>
      <a href="/community/recruit" className="btn-ghost mt-4 !py-2 !text-label-md">
        매장 제보하기
      </a>
    </div>
  );
}
