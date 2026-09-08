"use client";

import { useEffect, useRef, useState } from "react";

import { KAKAO_MAP_KEY } from "@/lib/constants";
import type { Shop } from "@/lib/types/database";

declare global {
  interface Window {
    // eslint-disable-next-line
    kakao: any;
  }
}

const CACHE_KEY = "rr:shop-geo:v1";
const SDK_ID = "kakao-maps-sdk";

type LatLng = { lat: number; lng: number };

function loadCache(): Record<string, LatLng> {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) ?? "{}");
  } catch {
    return {};
  }
}
function saveCache(c: Record<string, LatLng>) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(c));
  } catch {
    /* noop */
  }
}

function loadSdk(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.kakao?.maps) return resolve();
    const existing = document.getElementById(SDK_ID) as HTMLScriptElement | null;
    const onReady = () => window.kakao.maps.load(() => resolve());
    if (existing) {
      existing.addEventListener("load", onReady);
      existing.addEventListener("error", () => reject(new Error("SDK load error")));
      return;
    }
    const s = document.createElement("script");
    s.id = SDK_ID;
    s.async = true;
    s.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_MAP_KEY}&autoload=false&libraries=services,clusterer`;
    s.onload = onReady;
    s.onerror = () => reject(new Error("SDK load error"));
    document.head.appendChild(s);
  });
}

/** 카카오맵에 매장을 마커로 표시. 좌표 없는 매장은 키워드 검색으로 위치를 찾아 캐시. */
export function ShopMap({ shops }: { shops: Shop[] }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [placed, setPlaced] = useState(0);

  useEffect(() => {
    if (!KAKAO_MAP_KEY) {
      setStatus("error");
      return;
    }
    let cancelled = false;

    (async () => {
      try {
        await loadSdk();
        if (cancelled || !boxRef.current) return;
        const { kakao } = window;

        const map = new kakao.maps.Map(boxRef.current, {
          center: new kakao.maps.LatLng(36.5, 127.9),
          level: 13,
        });
        const clusterer = new kakao.maps.MarkerClusterer({
          map,
          averageCenter: true,
          minLevel: 7,
        });
        const geocoder = new kakao.maps.services.Geocoder();
        const places = new kakao.maps.services.Places();
        const bounds = new kakao.maps.LatLngBounds();
        const cache = loadCache();
        let cacheDirty = false;
        let count = 0;

        const infowindow = new kakao.maps.InfoWindow({ zIndex: 3 });

        const addMarker = (s: Shop, pos: any) => {
          const marker = new kakao.maps.Marker({ position: pos });
          clusterer.addMarker(marker);
          bounds.extend(pos);
          count += 1;
          if (!cancelled) setPlaced(count);
          kakao.maps.event.addListener(marker, "click", () => {
            const q = encodeURIComponent(`${s.name} ${s.sido} ${s.sigungu ?? ""}`.trim());
            infowindow.setContent(
              `<div style="padding:6px 10px;font-size:12px;line-height:1.5;max-width:200px">
                 <b>${s.name}</b><br/>${s.sido} ${s.sigungu ?? ""}<br/>
                 <a href="https://map.kakao.com/?q=${q}" target="_blank" rel="noopener" style="color:#4648d4">카카오맵에서 보기 ↗</a>
               </div>`,
            );
            infowindow.open(map, marker);
          });
        };

        const resolveShop = (s: Shop): Promise<any | null> =>
          new Promise((res) => {
            if (typeof s.lat === "number" && typeof s.lng === "number") {
              return res(new kakao.maps.LatLng(s.lat, s.lng));
            }
            const key = `${s.name}|${s.sido}|${s.sigungu ?? ""}`;
            const hit = cache[key];
            if (hit) return res(new kakao.maps.LatLng(hit.lat, hit.lng));

            const done = (lat: number, lng: number) => {
              cache[key] = { lat, lng };
              cacheDirty = true;
              res(new kakao.maps.LatLng(lat, lng));
            };
            // 1) 주소(있으면) → 2) 매장명+지역 키워드
            geocoder.addressSearch(`${s.sido} ${s.sigungu ?? ""} ${s.address}`.trim(), (r: any[], st: string) => {
              if (st === kakao.maps.services.Status.OK && r[0]) {
                return done(Number(r[0].y), Number(r[0].x));
              }
              places.keywordSearch(
                `${s.name} ${s.sigungu ?? s.sido}`.trim(),
                (pr: any[], pst: string) => {
                  if (pst === kakao.maps.services.Status.OK && pr[0]) {
                    return done(Number(pr[0].y), Number(pr[0].x));
                  }
                  res(null);
                },
              );
            });
          });

        // 순차 처리(레이트리밋 회피). 좌표 있는 건 먼저.
        const ordered = [...shops].sort((a, b) => {
          const ha = typeof a.lat === "number" ? 0 : 1;
          const hb = typeof b.lat === "number" ? 0 : 1;
          return ha - hb;
        });

        setStatus("ready");
        for (const s of ordered) {
          if (cancelled) break;
          const pos = await resolveShop(s);
          if (pos) {
            addMarker(s, pos);
            if (count === 1) map.setCenter(pos);
            else map.setBounds(bounds);
          }
          await new Promise((r) => setTimeout(r, 40));
        }
        if (cacheDirty) saveCache(cache);
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [shops]);

  if (status === "error") {
    return (
      <div className="grid place-items-center rounded-2xl border border-line/70 bg-card p-10 text-center text-body-sm text-ink-soft">
        지도를 불러오지 못했습니다. 목록 보기를 이용해 주세요.
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-line/70">
      <div ref={boxRef} className="h-[420px] w-full bg-subcanvas sm:h-[520px]" />
      <div className="pointer-events-none absolute left-3 top-3 rounded-full bg-scrim/70 px-2.5 py-1 text-label-sm font-bold text-white">
        {status === "loading" ? "지도 불러오는 중…" : `매장 ${placed} / ${shops.length}`}
      </div>
    </div>
  );
}
