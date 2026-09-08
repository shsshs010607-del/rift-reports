/**
 * 카드샵 좌표 채우기 — shops.lat/lng 가 비어있는 행을 카카오 로컬 API 로 지오코딩.
 *   npx tsx scripts/geocode-shops.ts
 *
 * env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, KAKAO_REST_API_KEY
 *   (KAKAO_REST_API_KEY = 카카오 개발자 콘솔 > 내 애플리케이션 > 앱 키 > REST API 키)
 *
 * 실행 후엔 /shops 지도가 클라이언트 검색 없이 즉시 마커를 찍는다.
 */
import { loadEnv, requireEnv, supabaseAdmin } from "./_shared";

loadEnv();

const REST_KEY = requireEnv("KAKAO_REST_API_KEY");
const HEADERS = { Authorization: `KakaoAK ${REST_KEY}` };

async function addressSearch(query: string): Promise<{ lat: number; lng: number } | null> {
  const url = `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(query)}`;
  const r = await fetch(url, { headers: HEADERS });
  if (!r.ok) return null;
  const j = (await r.json()) as { documents?: { x: string; y: string }[] };
  const d = j.documents?.[0];
  return d ? { lat: Number(d.y), lng: Number(d.x) } : null;
}

async function keywordSearch(query: string): Promise<{ lat: number; lng: number } | null> {
  const url = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(query)}&size=1`;
  const r = await fetch(url, { headers: HEADERS });
  if (!r.ok) return null;
  const j = (await r.json()) as { documents?: { x: string; y: string }[] };
  const d = j.documents?.[0];
  return d ? { lat: Number(d.y), lng: Number(d.x) } : null;
}

async function main() {
  const sb = supabaseAdmin();
  const { data: shops, error } = await sb
    .from("shops")
    .select("id, name, sido, sigungu, address, lat, lng")
    .or("lat.is.null,lng.is.null");
  if (error) throw error;

  console.log(`좌표 없는 매장 ${shops?.length ?? 0}곳`);
  let ok = 0;
  let fail = 0;

  for (const s of shops ?? []) {
    const region = `${s.sido} ${s.sigungu ?? ""}`.trim();
    const hit =
      (await addressSearch(`${region} ${s.address}`.trim())) ??
      (await keywordSearch(`${s.name} ${s.sigungu ?? s.sido}`.trim())) ??
      (await keywordSearch(`${region} ${s.address}`.trim()));

    if (hit) {
      const { error: upErr } = await sb.from("shops").update({ lat: hit.lat, lng: hit.lng }).eq("id", s.id);
      if (upErr) {
        console.warn(`  ✗ ${s.name} 저장 실패: ${upErr.message}`);
        fail++;
      } else {
        console.log(`  ✓ ${s.name} → ${hit.lat.toFixed(5)}, ${hit.lng.toFixed(5)}`);
        ok++;
      }
    } else {
      console.warn(`  ? ${s.name} (${region} ${s.address}) — 위치 못 찾음`);
      fail++;
    }
    await new Promise((r) => setTimeout(r, 120)); // 카카오 QPS 여유
  }

  console.log(`\n완료: 성공 ${ok} · 실패/미발견 ${fail}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
