"use client";

import { useMemo, useState } from "react";
import { Search, ShieldCheck, Phone, Clock, ExternalLink, MapPin } from "lucide-react";
import { KR_SIDO } from "@/lib/constants";
import type { Shop } from "@/lib/types/database";
import { ShopMap } from "@/components/shops/shop-map";
import { cn } from "@/lib/utils";

export function ShopExplorer({ shops }: { shops: Shop[] }) {
  const [sido, setSido] = useState("");
  const [officialOnly, setOfficialOnly] = useState(false);
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

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

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(300px,440px)]">
        {shops.length === 0 ? (
          <EmptyState />
        ) : view.length === 0 ? (
          <p className="grid place-items-center rounded-2xl border border-line/70 bg-card p-12 text-center text-body-sm text-ink-soft">
            조건에 맞는 매장이 없습니다.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {view.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(s.id)}
                  className={cn(
                    "w-full rounded-2xl border p-3.5 text-left transition",
                    selectedId === s.id
                      ? "border-primary bg-primary/[0.04]"
                      : "border-line/70 bg-card hover:border-primary/40",
                  )}
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
                    {s.url && (
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-primary-strong hover:underline"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        링크
                      </a>
                    )}
                  </div>
                  {s.note && <p className="mt-1 text-body-sm text-ink-soft">{s.note}</p>}
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="lg:sticky lg:top-24 lg:self-start">
          <ShopMap
            shops={view.map((s) => ({
              id: s.id,
              name: s.name,
              address: s.address,
              lat: s.lat,
              lng: s.lng,
              is_official: s.is_official,
            }))}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </div>
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
