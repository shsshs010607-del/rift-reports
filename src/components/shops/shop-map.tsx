"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Script from "next/script";
import { MapPin } from "lucide-react";
import { KAKAO_MAP_KEY } from "@/lib/constants";

// Kakao Maps SDK 는 공식 타입이 없어 any 로 다룬다.
type KakaoNS = { maps: any };
declare global {
  interface Window {
    kakao?: KakaoNS;
  }
}

export type MapShop = {
  id: string;
  name: string;
  address: string;
  lat: number | null;
  lng: number | null;
  is_official: boolean;
};

export function ShopMap({
  shops,
  selectedId,
  onSelect,
}: {
  shops: MapShop[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  const initMap = useCallback(() => {
    const kakao = window.kakao;
    if (!kakao?.maps || !boxRef.current) return;
    kakao.maps.load(() => {
      mapRef.current = new kakao.maps.Map(boxRef.current, {
        center: new kakao.maps.LatLng(36.5, 127.8),
        level: 13,
      });
      setReady(true);
    });
  }, []);

  // 마커 렌더
  useEffect(() => {
    const kakao = window.kakao;
    if (!ready || !kakao?.maps || !mapRef.current) return;
    const map = mapRef.current;
    const geocoder = new kakao.maps.services.Geocoder();
    const places = new kakao.maps.services.Places();
    const OK = kakao.maps.services.Status.OK;
    const bounds = new kakao.maps.LatLngBounds();

    for (const [, m] of markersRef.current) m.setMap(null);
    markersRef.current.clear();

    const place = (shop: MapShop, lat: number, lng: number) => {
      const pos = new kakao.maps.LatLng(lat, lng);
      const marker = new kakao.maps.Marker({ position: pos, map, title: shop.name });
      kakao.maps.event.addListener(marker, "click", () => onSelect?.(shop.id));
      markersRef.current.set(shop.id, marker);
      bounds.extend(pos);
      map.setBounds(bounds);
    };

    const resolve = (shop: MapShop) => {
      if (shop.lat != null && shop.lng != null) {
        place(shop, shop.lat, shop.lng);
        return;
      }
      // 1) 정확 주소 → 2) 매장명 키워드 → 3) 주소 키워드
      geocoder.addressSearch(shop.address, (r: any[], s: string) => {
        if (s === OK && r[0]) return place(shop, Number(r[0].y), Number(r[0].x));
        places.keywordSearch(
          `${shop.name}`,
          (r2: any[], s2: string) => {
            if (s2 === OK && r2[0]) return place(shop, Number(r2[0].y), Number(r2[0].x));
            places.keywordSearch(shop.address, (r3: any[], s3: string) => {
              if (s3 === OK && r3[0]) place(shop, Number(r3[0].y), Number(r3[0].x));
            });
          },
        );
      });
    };

    for (const shop of shops) resolve(shop);
  }, [ready, shops, onSelect]);

  // 선택 매장으로 이동
  useEffect(() => {
    if (!ready || !selectedId) return;
    const marker = markersRef.current.get(selectedId);
    if (marker && mapRef.current) {
      mapRef.current.setLevel(4);
      mapRef.current.panTo(marker.getPosition());
    }
  }, [selectedId, ready]);

  if (!KAKAO_MAP_KEY) {
    return (
      <div className="grid min-h-[280px] place-items-center rounded-2xl border border-line/70 bg-subcanvas/50 text-center text-ink-soft">
        <div>
          <MapPin className="mx-auto h-6 w-6" />
          <p className="mt-2 text-body-sm">지도 준비 중 (Kakao Map 키 미설정)</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Script
        src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_MAP_KEY}&autoload=false&libraries=services`}
        strategy="afterInteractive"
        onLoad={initMap}
        onError={() => setFailed(true)}
      />
      <div className="relative min-h-[280px] overflow-hidden rounded-2xl border border-line/70">
        <div ref={boxRef} className="h-full min-h-[280px] w-full" />
        {failed && (
          <div className="absolute inset-0 grid place-items-center bg-subcanvas/90 p-4 text-center text-body-sm text-ink-soft">
            지도를 불러오지 못했습니다. Kakao 콘솔에 이 도메인이 등록됐는지 확인하세요.
          </div>
        )}
      </div>
    </>
  );
}
